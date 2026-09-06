package com.jansetu4.portal.portal.service;

import com.jansetu4.portal.portal.entity.*;
import com.jansetu4.portal.portal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final PortalUniversityRepository universityRepository;
    private final IndustryPartnerRepository industryPartnerRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final PortalChallengeRepository challengeRepository;

    @Override
    public void run(String... args) {
        try {
            if (universityRepository.count() == 0) {
                log.info("Seeding initial Universities into app_db...");
                universityRepository.saveAll(List.of(
                        UniversityEntity.builder()
                                .name("Birsa Institute of Technology (BIT) Mesra")
                                .shortName("BIT Mesra")
                                .district("Ranchi")
                                .description("Premier engineering and technological institute in Ranchi with extensive rural outreach programs.")
                                .departments(List.of("Civil Engineering", "Computer Science", "Electrical Engineering", "Environmental Science"))
                                .expertiseTags(List.of("Groundwater", "Water Management", "Renewable Energy", "Solar", "IoT"))
                                .labs(List.of("Water & Wastewater Lab", "IoT & Sensor Network Lab", "Renewable Energy Research Center"))
                                .pastProjects(List.of("Handpump recharge pits pilot in Palamu", "Micro-grid solar operator model"))
                                .patentsFiled(12)
                                .startupsSpunOff(4)
                                .build(),
                        UniversityEntity.builder()
                                .name("Indian Institute of Technology (ISM) Dhanbad")
                                .shortName("IIT (ISM) Dhanbad")
                                .district("Dhanbad")
                                .description("Institute of national importance specializing in mining, environmental engineering, and earth sciences.")
                                .departments(List.of("Environmental Engineering", "Mining Engineering", "Civil Engineering"))
                                .expertiseTags(List.of("Water Quality", "Filtration", "Mining & Pollution", "Environmental Science"))
                                .labs(List.of("Advanced Environmental Analysis Lab", "Water Filtration Testing Center"))
                                .pastProjects(List.of("Fluoride mitigation in Giridih using activated alumina"))
                                .patentsFiled(28)
                                .startupsSpunOff(7)
                                .build(),
                        UniversityEntity.builder()
                                .name("National Institute of Technology (NIT) Jamshedpur")
                                .shortName("NIT Jamshedpur")
                                .district("East Singhbhum")
                                .description("Institute of national importance known for rural infrastructure, metallurgy, and civil engineering.")
                                .departments(List.of("Civil Engineering", "Mechanical Engineering", "Electrical Engineering"))
                                .expertiseTags(List.of("Civil Engineering", "Rural Roads & Connectivity", "Structural Engineering"))
                                .labs(List.of("Structural Dynamics Lab", "Soil Mechanics Lab"))
                                .pastProjects(List.of("Low-cost culvert design for monsoon-cut villages"))
                                .patentsFiled(15)
                                .startupsSpunOff(3)
                                .build(),
                        UniversityEntity.builder()
                                .name("Birsa Agricultural University (BAU) Ranchi")
                                .shortName("BAU Ranchi")
                                .district("Ranchi")
                                .description("Pioneering state agricultural university dedicated to rainfed farming, irrigation, and agronomy.")
                                .departments(List.of("Agronomy", "Soil Science", "Agricultural Engineering", "Plant Protection"))
                                .expertiseTags(List.of("Agricultural Engineering", "Irrigation", "Soil Science", "Crop Loss & Yield"))
                                .labs(List.of("Soil & Water Testing Center", "Rainfed Farming Research Unit"))
                                .pastProjects(List.of("Farm-pond rainwater harvesting in Gumla"))
                                .patentsFiled(6)
                                .startupsSpunOff(2)
                                .build(),
                        UniversityEntity.builder()
                                .name("Rajendra Institute of Medical Sciences (RIMS) Ranchi")
                                .shortName("RIMS Ranchi")
                                .district("Ranchi")
                                .description("Apex medical research institute and hospital driving rural public health and telemedicine.")
                                .departments(List.of("Community Medicine", "Biomedical Engineering", "Public Health", "Pediatrics"))
                                .expertiseTags(List.of("Public Health", "Telemedicine", "Rural Health Access", "Nutrition"))
                                .labs(List.of("Tele-health Center", "Nutritional Biochemistry Unit"))
                                .pastProjects(List.of("Telemedicine outreach for PHCs in Khunti"))
                                .patentsFiled(4)
                                .startupsSpunOff(1)
                                .build()
                ));
            }

            if (knowledgeBaseRepository.count() == 0) {
                log.info("Seeding initial Knowledge Base items into app_db...");
                knowledgeBaseRepository.saveAll(List.of(
                        KnowledgeItemEntity.builder()
                                .title("Handpump recharge pits in Palamu — pilot results 2024")
                                .type("Past Project")
                                .category("Water")
                                .tags(List.of("handpump", "recharge", "groundwater", "Drinking Water Scarcity", "Palamu"))
                                .summary("Recharge pits 3–5 m from handpumps extended summer availability by 6–8 weeks in 6 of 8 pilot villages. Cost ₹45,000 per pit.")
                                .source("BIT Mesra / JanaSetu")
                                .costLakh(4)
                                .build(),
                        KnowledgeItemEntity.builder()
                                .title("Solar IoT water-level monitoring for rural supply")
                                .type("Case Study")
                                .category("Water")
                                .tags(List.of("IoT", "sensor", "water level", "monitoring", "solar", "Drinking Water Scarcity"))
                                .summary("ESP32 + ultrasonic sensor units with GSM reporting; ₹4,200 per unit at 50 units; 92% uptime over one monsoon.")
                                .source("JalSense Technologies")
                                .costLakh(3)
                                .build(),
                        KnowledgeItemEntity.builder()
                                .title("Fluoride mitigation in Giridih using activated alumina")
                                .type("Research Paper")
                                .category("Water")
                                .tags(List.of("fluoride", "water quality", "filtration", "Water Quality"))
                                .summary("Community-scale activated alumina columns reduced fluoride from 4.1 to 0.9 mg/L; regeneration needed every 4 months.")
                                .source("IIT (ISM) Dhanbad")
                                .costLakh(6)
                                .build(),
                        KnowledgeItemEntity.builder()
                                .title("Farm-pond based rainwater harvesting in Gumla")
                                .type("Past Project")
                                .category("Agriculture")
                                .tags(List.of("rainwater", "farm pond", "irrigation", "Irrigation"))
                                .summary("5% farm area ponds provided life-saving irrigation for rabi vegetables; income up 38% for 120 farmers.")
                                .source("BAU Ranchi")
                                .costLakh(9)
                                .build(),
                        KnowledgeItemEntity.builder()
                                .title("Telemedicine outreach model for PHCs in Khunti")
                                .type("Case Study")
                                .category("Healthcare")
                                .tags(List.of("telemedicine", "PHC", "Rural Health Access", "health worker"))
                                .summary("Weekly tele-consultations via ANMs at 6 PHCs reduced referral travel by 60%; needs reliable 4G or offline sync.")
                                .source("RIMS Ranchi")
                                .costLakh(5)
                                .build()
                ));
            }
        } catch (Exception e) {
            log.warn("Database initialization check skipped: {}", e.getMessage());
        }
    }
}
