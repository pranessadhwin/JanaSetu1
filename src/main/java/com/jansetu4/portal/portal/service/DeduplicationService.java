package com.jansetu4.portal.portal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jansetu4.portal.config.AiConfig;
import com.jansetu4.portal.portal.entity.ChallengeEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
public class DeduplicationService {

    private final AiConfig aiConfig;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-zA-Z0-9\\s]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    private static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "the", "and", "or", "is", "are", "was", "were", "in", "on", "at",
            "to", "for", "of", "with", "by", "from", "up", "about", "into", "over", "after",
            "this", "that", "these", "those", "there", "it", "its", "not", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "can", "could", "will", "would",
            "should", "our", "we", "my", "me", "us", "you", "your", "they", "them", "their",
            "problem", "issue", "village", "area", "please", "help", "need",
            "hai", "hain", "ke", "ki", "ka", "ko", "se", "mein", "par", "aur", "ya",
            "yeh", "woh", "kripya", "madad", "chahiye"
    );

    public DeduplicationService(AiConfig aiConfig, ObjectMapper objectMapper) {
        this.aiConfig = aiConfig;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    public record DuplicateMatch(ChallengeEntity challenge, double score, String reason) {}
    public record AiDuplicateCheckResult(boolean isDuplicate, double confidence, String reason) {}

    /**
     * Calculates distance between two GPS coordinates using the Haversine formula.
     * Returns distance in meters.
     */
    public static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000.0; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Spatial candidate check:
     * 1. Same category (case-insensitive)
     * 2. Within 100 meters by GPS, or same village/block if GPS is absent
     */
    public boolean isSpatialCandidate(ChallengeEntity a, ChallengeEntity b) {
        if (a == null || b == null) return false;
        if (a.getId() != null && a.getId().equals(b.getId())) return false;

        // Must be of the same category
        if (a.getCategory() == null || b.getCategory() == null ||
                !a.getCategory().trim().equalsIgnoreCase(b.getCategory().trim())) {
            return false;
        }

        // 1. If both have GPS coordinates, check if within 100 meters
        if (a.getLat() != null && a.getLng() != null && b.getLat() != null && b.getLng() != null) {
            double meters = distanceMeters(a.getLat(), a.getLng(), b.getLat(), b.getLng());
            if (meters <= 100.0) {
                return true;
            }
        }

        // 2. If GPS not provided or jittered, check if same village in the same district
        boolean sameDistrict = a.getDistrict() != null && b.getDistrict() != null &&
                a.getDistrict().trim().equalsIgnoreCase(b.getDistrict().trim());

        if (sameDistrict && a.getVillage() != null && !a.getVillage().isBlank() &&
                b.getVillage() != null && !b.getVillage().isBlank() &&
                a.getVillage().trim().equalsIgnoreCase(b.getVillage().trim())) {
            return true;
        }

        return false;
    }

    /**
     * Checks if two complaints are duplicates using AI (OpenAI/Groq compatible).
     * Falls back to token-based lexical similarity if AI is unavailable.
     */
    public AiDuplicateCheckResult checkWithAi(ChallengeEntity a, ChallengeEntity b) {
        if (aiConfig != null && StringUtils.hasText(aiConfig.getApiKey())) {
            try {
                String systemPrompt = "You are a civic-issue deduplication assistant. "
                        + "Determine whether the following two citizen complaints refer to the EXACT SAME real-world problem "
                        + "(e.g. the same broken water pipe, same damaged transformer, same pothole, same garbage pile) "
                        + "or are distinct issues. Respond ONLY with a JSON object in the exact format: "
                        + "{\"isDuplicate\": true|false, \"confidence\": 0.0 to 1.0, \"reason\": \"<short explanation>\"}";

                String userPrompt = String.format("Complaint 1:\nTitle: %s\nDescription: %s\nLocation: %s, %s, %s\n\n"
                                + "Complaint 2:\nTitle: %s\nDescription: %s\nLocation: %s, %s, %s",
                        a.getTitle(), a.getDescription(), a.getVillage(), a.getBlock(), a.getDistrict(),
                        b.getTitle(), b.getDescription(), b.getVillage(), b.getBlock(), b.getDistrict()
                );

                Map<String, Object> requestBody = Map.of(
                        "model", aiConfig.getModel(),
                        "temperature", 0,
                        "max_tokens", 150,
                        "response_format", Map.of("type", "json_object"),
                        "messages", List.of(
                                Map.of("role", "system", "content", systemPrompt),
                                Map.of("role", "user", "content", userPrompt)
                        )
                );

                JsonNode response = restClient.post()
                        .uri(aiConfig.getBaseUrl() + "/chat/completions")
                        .header("Authorization", "Bearer " + aiConfig.getApiKey())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(requestBody)
                        .retrieve()
                        .body(JsonNode.class);

                String content = response.path("choices").path(0).path("message").path("content").asText();
                JsonNode parsed = objectMapper.readTree(content);

                boolean isDup = parsed.path("isDuplicate").asBoolean(false);
                double conf = parsed.path("confidence").asDouble(0.0);
                String reason = parsed.path("reason").asText("");

                return new AiDuplicateCheckResult(isDup, conf, reason);
            } catch (Exception ex) {
                log.warn("AI duplicate check failed ({}), falling back to lexical similarity", ex.getMessage());
            }
        }

        return checkWithLexicalFallback(a, b);
    }

    /**
     * Lexical token-overlap fallback when AI API is unavailable.
     */
    public AiDuplicateCheckResult checkWithLexicalFallback(ChallengeEntity a, ChallengeEntity b) {
        Set<String> aTitle = tokenize(a.getTitle());
        Set<String> bTitle = tokenize(b.getTitle());
        Set<String> aDesc = tokenize(a.getDescription());
        Set<String> bDesc = tokenize(b.getDescription());

        Set<String> aAll = new HashSet<>(aTitle);
        aAll.addAll(aDesc);
        Set<String> bAll = new HashSet<>(bTitle);
        bAll.addAll(bDesc);

        double titleJaccard = jaccard(aTitle, bTitle);
        double allJaccard = jaccard(aAll, bAll);
        int sharedCount = countIntersection(aAll, bAll);

        String normA = normalize(a.getTitle());
        String normB = normalize(b.getTitle());

        if (!normA.isBlank() && normA.equals(normB)) {
            return new AiDuplicateCheckResult(true, 1.0, "Identical title reported at the same location");
        }
        if (titleJaccard >= 0.50 && sharedCount >= 2) {
            return new AiDuplicateCheckResult(true, titleJaccard, String.format("Title overlap is %.0f%% with matching keywords", titleJaccard * 100));
        }
        if ((allJaccard >= 0.35 && sharedCount >= 3) || sharedCount >= 4) {
            List<String> commonWords = aAll.stream().filter(bAll::contains).limit(4).toList();
            return new AiDuplicateCheckResult(true, Math.max(allJaccard, 0.70),
                    String.format("High content overlap (%d shared keywords: %s)", sharedCount, String.join(", ", commonWords)));
        }

        return new AiDuplicateCheckResult(false, 0.0, "Reports describe distinct issues");
    }

    /**
     * Checks candidate challenges in the same district for duplication.
     * Returns the best match if similarity exceeds the threshold.
     */
    public Optional<DuplicateMatch> findDuplicate(
            String title,
            String description,
            String district,
            String category,
            List<ChallengeEntity> candidates
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return Optional.empty();
        }

        Set<String> newTitleTokens = tokenize(title);
        Set<String> newDescTokens = tokenize(description);
        Set<String> newAllTokens = new HashSet<>(newTitleTokens);
        newAllTokens.addAll(newDescTokens);

        String normNewTitle = normalize(title);

        DuplicateMatch bestMatch = null;
        double highestScore = 0.0;

        for (ChallengeEntity candidate : candidates) {
            if (candidate.getDistrict() != null && district != null &&
                    !candidate.getDistrict().trim().equalsIgnoreCase(district.trim())) {
                continue;
            }

            String normCandTitle = normalize(candidate.getTitle());

            // 1. Exact or near-exact normalized title
            if (!normNewTitle.isBlank() && normNewTitle.equals(normCandTitle)) {
                return Optional.of(new DuplicateMatch(candidate, 1.0, "Identical title reported in " + district));
            }

            Set<String> candTitleTokens = tokenize(candidate.getTitle());
            Set<String> candDescTokens = tokenize(candidate.getDescription());
            Set<String> candAllTokens = new HashSet<>(candTitleTokens);
            candAllTokens.addAll(candDescTokens);

            double titleJaccard = jaccard(newTitleTokens, candTitleTokens);
            double allJaccard = jaccard(newAllTokens, candAllTokens);

            int sharedKeywords = countIntersection(newAllTokens, candAllTokens);

            boolean sameCategory = category != null && candidate.getCategory() != null &&
                    category.equalsIgnoreCase(candidate.getCategory());

            double score = 0.0;
            String reason = null;

            // Highly similar title (>= 0.65 Jaccard with at least 2 keywords)
            if (titleJaccard >= 0.65 && sharedKeywords >= 2) {
                score = titleJaccard;
                reason = String.format("Very similar title (%.0f%% overlap)", titleJaccard * 100);
            }
            // Same category + strong content overlap (>= 0.40 Jaccard with at least 3 shared keywords)
            else if (sameCategory && allJaccard >= 0.40 && sharedKeywords >= 3) {
                score = allJaccard;
                reason = String.format("Same category (%s) and high content overlap (%.0f%%)", category, allJaccard * 100);
            }
            // High content overlap (>= 0.55 Jaccard with at least 4 shared keywords) even across categories
            else if (allJaccard >= 0.55 && sharedKeywords >= 4) {
                score = allJaccard;
                reason = String.format("High content overlap (%.0f%%)", allJaccard * 100);
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = new DuplicateMatch(candidate, score, reason);
            }
        }

        return Optional.ofNullable(bestMatch);
    }

    private double jaccard(Set<String> s1, Set<String> s2) {
        if (s1.isEmpty() && s2.isEmpty()) return 1.0;
        if (s1.isEmpty() || s2.isEmpty()) return 0.0;
        int intersection = countIntersection(s1, s2);
        int union = s1.size() + s2.size() - intersection;
        return union == 0 ? 0.0 : (double) intersection / union;
    }

    private int countIntersection(Set<String> s1, Set<String> s2) {
        int count = 0;
        for (String s : s1) {
            if (s2.contains(s)) count++;
        }
        return count;
    }

    private Set<String> tokenize(String text) {
        if (text == null || text.isBlank()) return Collections.emptySet();
        String cleaned = NON_ALPHANUMERIC.matcher(text.toLowerCase()).replaceAll(" ");
        String[] words = WHITESPACE.split(cleaned.trim());
        Set<String> tokens = new HashSet<>();
        for (String w : words) {
            if (w.length() > 2 && !STOP_WORDS.contains(w)) {
                tokens.add(w);
            }
        }
        return tokens;
    }

    private String normalize(String text) {
        if (text == null) return "";
        return NON_ALPHANUMERIC.matcher(text.toLowerCase()).replaceAll(" ").trim().replaceAll("\\s+", " ");
    }
}
