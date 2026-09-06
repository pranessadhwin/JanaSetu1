package com.jansetu4.portal.portal.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service("portalClassificationService")
public class PortalClassificationService {

    public static final List<String> CATEGORIES = List.of(
            "Water", "Healthcare", "Agriculture", "Infrastructure",
            "Education", "Environment", "Energy", "Sanitation", "Livelihood"
    );

    @Getter
    @AllArgsConstructor
    public static class Rule {
        private String category;
        private String subTag;
        private List<String> keywords;
        private List<String> expertise;
    }

    @Getter
    @Builder
    public static class ClassificationResult {
        private String category;
        private List<String> subTags;
        private List<String> urgencyKeywords;
        private List<String> vulnerableGroups;
        private List<String> requiredExpertise;
        private String summary;
        private String frequencyHint;
        private Boolean alternativeHint;
    }

    private static final List<Rule> RULES = List.of(
            new Rule("Water", "Drinking Water Scarcity",
                    List.of("handpump", "hand pump", "dries up", "dry up", "water shortage", "no water", "drinking water", "borewell", "well dry", "tanker", "groundwater", "water scarcity", "paani", "pani"),
                    List.of("Groundwater", "Hydrology", "Civil Engineering", "Water Management", "Rainwater Harvesting")),
            new Rule("Water", "Water Quality",
                    List.of("fluoride", "arsenic", "contaminated", "dirty water", "yellow water", "iron in water", "water quality", "turbid"),
                    List.of("Water Quality", "Environmental Engineering", "Chemistry", "Filtration")),
            new Rule("Agriculture", "Irrigation",
                    List.of("irrigation", "canal", "crop water", "drip", "sprinkler", "farm water", "paddy water"),
                    List.of("Agricultural Engineering", "Irrigation", "Soil Science", "Water Management")),
            new Rule("Agriculture", "Crop Loss & Yield",
                    List.of("crop failure", "pest", "yield", "seed", "fertilizer", "crop loss", "drought crop", "kharif", "rabi", "farmers"),
                    List.of("Agronomy", "Plant Protection", "Soil Science", "Agricultural Engineering")),
            new Rule("Agriculture", "Post-Harvest & Storage",
                    List.of("cold storage", "storage", "spoil", "rotting", "market price", "mandi", "post-harvest"),
                    List.of("Food Technology", "Agricultural Engineering", "Supply Chain")),
            new Rule("Healthcare", "Rural Health Access",
                    List.of("hospital", "doctor", "clinic", "phc", "ambulance", "medicine", "health centre", "health center", "pregnant", "maternal", "malaria", "fever", "vaccination"),
                    List.of("Public Health", "Biomedical Engineering", "Telemedicine", "Community Medicine")),
            new Rule("Healthcare", "Nutrition",
                    List.of("malnutrition", "anganwadi", "underweight", "nutrition", "anaemia", "anemia"),
                    List.of("Public Health", "Nutrition", "Food Technology")),
            new Rule("Infrastructure", "Rural Roads & Connectivity",
                    List.of("road", "bridge", "culvert", "pothole", "cut off", "monsoon road", "no road", "connectivity"),
                    List.of("Civil Engineering", "Structural Engineering", "Transportation")),
            new Rule("Infrastructure", "Digital Connectivity",
                    List.of("mobile network", "internet", "signal", "no network", "broadband", "wifi"),
                    List.of("Computer Science", "Electronics & Communication", "IoT")),
            new Rule("Education", "School Infrastructure",
                    List.of("school", "classroom", "teacher", "students", "dropout", "blackboard", "smart class", "library"),
                    List.of("Education Technology", "Computer Science", "Social Sciences")),
            new Rule("Environment", "Mining & Pollution",
                    List.of("mining", "coal dust", "pollution", "smoke", "air quality", "fly ash", "dust"),
                    List.of("Environmental Engineering", "Mining Engineering", "Environmental Science")),
            new Rule("Environment", "Forest & Wildlife",
                    List.of("elephant", "forest", "deforestation", "wildlife", "human-animal conflict", "trees cut"),
                    List.of("Environmental Science", "Forestry", "IoT", "Computer Science")),
            new Rule("Environment", "Waste Management",
                    List.of("garbage", "waste", "plastic", "dump", "littering", "solid waste"),
                    List.of("Environmental Engineering", "Civil Engineering", "Waste Management")),
            new Rule("Energy", "Electricity Access",
                    List.of("electricity", "power cut", "no power", "solar", "bijli", "load shedding", "transformer", "street light"),
                    List.of("Electrical Engineering", "Renewable Energy", "Solar")),
            new Rule("Sanitation", "Toilets & Drainage",
                    List.of("toilet", "open defecation", "drain", "sewage", "waterlogging", "sanitation", "flooding street"),
                    List.of("Civil Engineering", "Environmental Engineering", "Public Health")),
            new Rule("Livelihood", "Employment & Skills",
                    List.of("unemployment", "jobs", "migration", "skill", "self help group", "shg", "handicraft", "income", "livelihood"),
                    List.of("Management", "Social Sciences", "Rural Development", "Entrepreneurship"))
    );

    private static final List<String> URGENCY_TERMS = List.of(
            "emergency", "death", "died", "dying", "disease", "outbreak", "cholera", "diarrhoea", "diarrhea",
            "collapse", "collapsed", "accident", "unsafe", "danger", "dangerous", "life threatening", "children sick",
            "no alternative", "completely dry", "no water at all", "starving", "fire", "flood"
    );

    private static final Map<String, List<String>> VULNERABLE_TERMS = Map.of(
            "Children", List.of("children", "child", "kids", "school children", "infants"),
            "Women", List.of("women", "pregnant", "mothers", "girls"),
            "Elderly", List.of("elderly", "old people", "senior"),
            "Tribal communities", List.of("tribal", "adivasi", "pvtg", "santhal", "munda", "oraon", "ho tribe"),
            "Persons with disabilities", List.of("disabled", "disability", "handicapped")
    );

    public ClassificationResult classify(String title, String description, String forcedCategory) {
        String text = ((title != null ? title : "") + " " + (description != null ? description : "")).toLowerCase();

        Map<Rule, Integer> scores = new HashMap<>();
        for (Rule rule : RULES) {
            int score = 0;
            for (String kw : rule.getKeywords()) {
                if (text.contains(kw)) {
                    score += kw.contains(" ") ? 2 : 1;
                }
            }
            if (score > 0) {
                scores.put(rule, score);
            }
        }

        List<Rule> ranked = scores.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        if (forcedCategory != null && !forcedCategory.trim().isEmpty() && CATEGORIES.contains(forcedCategory.trim())) {
            List<Rule> inForced = ranked.stream()
                    .filter(r -> r.getCategory().equalsIgnoreCase(forcedCategory.trim()))
                    .collect(Collectors.toList());
            if (!inForced.isEmpty()) {
                ranked = inForced;
            } else {
                ranked = RULES.stream()
                        .filter(r -> r.getCategory().equalsIgnoreCase(forcedCategory.trim()))
                        .limit(1)
                        .collect(Collectors.toList());
            }
        }

        Rule primary = ranked.isEmpty() ? RULES.get(0) : ranked.get(0);
        String cat = primary.getCategory();

        List<String> subTags = ranked.stream()
                .filter(r -> r.getCategory().equalsIgnoreCase(cat))
                .map(Rule::getSubTag)
                .distinct()
                .limit(3)
                .collect(Collectors.toList());
        if (subTags.isEmpty()) {
            subTags = List.of(primary.getSubTag());
        }

        List<String> requiredExpertise = ranked.stream()
                .filter(r -> r.getCategory().equalsIgnoreCase(cat))
                .flatMap(r -> r.getExpertise().stream())
                .distinct()
                .limit(6)
                .collect(Collectors.toList());

        List<String> urgencyKeywords = URGENCY_TERMS.stream()
                .filter(text::contains)
                .collect(Collectors.toList());

        List<String> vulnerableGroups = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : VULNERABLE_TERMS.entrySet()) {
            if (entry.getValue().stream().anyMatch(text::contains)) {
                vulnerableGroups.add(entry.getKey());
            }
        }

        String freq = "occasional";
        if (Pattern.compile("(every summer|every year|seasonal|each summer|every monsoon|annually)").matcher(text).find()) {
            freq = "seasonal";
        } else if (Pattern.compile("(every day|daily|always|permanent|constant|throughout the year|whole year)").matcher(text).find()) {
            freq = "constant";
        }

        Boolean alt = null;
        if (Pattern.compile("(no alternative|no other source|only source|nearest .* km|walk .* km)").matcher(text).find()) {
            alt = false;
        } else if (Pattern.compile("(another source|other well|alternative source|nearby river)").matcher(text).find()) {
            alt = true;
        }

        String summary = cat + " issue (" + subTags.get(0) + ") reported: " + (title != null ? title.trim() : "") + ".";

        return ClassificationResult.builder()
                .category(cat)
                .subTags(subTags)
                .urgencyKeywords(urgencyKeywords)
                .vulnerableGroups(vulnerableGroups)
                .requiredExpertise(requiredExpertise)
                .summary(summary)
                .frequencyHint(freq)
                .alternativeHint(alt)
                .build();
    }
}
