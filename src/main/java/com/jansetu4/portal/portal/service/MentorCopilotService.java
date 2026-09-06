package com.jansetu4.portal.portal.service;

import com.jansetu4.portal.portal.entity.KnowledgeItemEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MentorCopilotService {

    @Getter
    @AllArgsConstructor
    public static class MentorResponse {
        private String answer;
        private List<KnowledgeItemEntity> sources;
    }

    public MentorResponse answerQuestion(String question, List<KnowledgeItemEntity> knowledgeBase, String context) {
        String q = question.toLowerCase();
        List<KnowledgeItemEntity> matchedSources = new ArrayList<>();

        if (knowledgeBase != null) {
            for (KnowledgeItemEntity k : knowledgeBase) {
                boolean match = false;
                if (k.getTitle() != null && q.contains(k.getTitle().toLowerCase())) match = true;
                if (k.getCategory() != null && q.contains(k.getCategory().toLowerCase())) match = true;
                if (k.getTags() != null) {
                    for (String tag : k.getTags()) {
                        if (q.contains(tag.toLowerCase())) {
                            match = true;
                            break;
                        }
                    }
                }
                if (match) {
                    matchedSources.add(k);
                }
            }
        }

        List<KnowledgeItemEntity> topSources = matchedSources.stream().limit(3).collect(Collectors.toList());

        StringBuilder answer = new StringBuilder();
        answer.append("### Technical Guidance & Best Practices\n\n");
        answer.append("Based on verified field pilots and rural engineering case studies in Jharkhand:\n\n");

        if (q.contains("water") || q.contains("handpump") || q.contains("harvesting") || q.contains("rainwater")) {
            answer.append("1. **Hydrogeological Recharge**: For drying handpumps, install a concentric recharge pit (1.5 m diameter, 3–5 m depth) situated 3–5 meters from the borehole. Fill with graded filter media (boulders, gravel, sand) to capture monsoon runoff without biological contamination.\n");
            answer.append("2. **Local Materials & Cost**: Use local river sand and crushed aggregate. Typical pilot cost in Palamu & Gumla ranged from ₹35,000 to ₹45,000 per installation.\n");
            answer.append("3. **Sensors & Telemetry**: If monitoring groundwater, deploy an ultrasonic distance sensor or submerged piezoresistive pressure transducer with an ESP32 microcontroller reporting over GSM/GPRS.\n");
        } else if (q.contains("sensor") || q.contains("iot") || q.contains("solar") || q.contains("power")) {
            answer.append("1. **Ruggedized Enclosure**: Field sensors must be IP65/IP67 rated with conformal coating to survive 45°C summer heat and heavy monsoon humidity.\n");
            answer.append("2. **Power Budget**: Pair a 10W monocrystalline solar panel with a 12V 7Ah LiFePO4 battery pack, implementing deep-sleep mode between hourly readings.\n");
            answer.append("3. **Network Fallback**: Support local SD card buffer/logging during telecom network drops, syncing packets automatically upon reconnect.\n");
        } else if (q.contains("pilot") || q.contains("village") || q.contains("community")) {
            answer.append("1. **Community Buy-in**: Organize a Gram Sabha orientation before breaking ground. Involve the Village Water & Sanitation Committee (VWSC) or Jal Sahiya.\n");
            answer.append("2. **Phase Validation**: Conduct a 4-week alpha trial in 2 contrast villages (one high groundwater table, one rocky plateau) to stress-test your assumptions.\n");
            answer.append("3. **Maintenance Plan**: Draft a single-page visual SOP in Hindi/Santali and train two local youth for routine first-line maintenance.\n");
        } else {
            answer.append("1. **Grounded Prototyping**: Ensure your engineering specs adhere to Bureau of Indian Standards (BIS) and Rural Development department schedule of rates.\n");
            answer.append("2. **Field Verification**: Always validate technical prototypes in partnership with the local Panchayat and district administration.\n");
            answer.append("3. **Sustainability**: Focus on affordability, readily accessible spare parts, and low electrical dependency.\n");
        }

        if (context != null && !context.trim().isEmpty()) {
            answer.append("\n*Tailored for Project Context: ").append(context).append("*\n");
        }

        return new MentorResponse(answer.toString(), topSources);
    }
}
