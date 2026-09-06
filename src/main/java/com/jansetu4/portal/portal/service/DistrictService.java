package com.jansetu4.portal.portal.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DistrictService {

    @Getter
    @AllArgsConstructor
    public static class DistrictInfo {
        private String name;
        private double lat;
        private double lng;
        private String division;
    }

    public static final List<DistrictInfo> DISTRICTS = List.of(
            new DistrictInfo("Ranchi", 23.34, 85.31, "South Chotanagpur"),
            new DistrictInfo("Khunti", 23.07, 85.28, "South Chotanagpur"),
            new DistrictInfo("Gumla", 23.04, 84.54, "South Chotanagpur"),
            new DistrictInfo("Simdega", 22.62, 84.51, "South Chotanagpur"),
            new DistrictInfo("Lohardaga", 23.43, 84.68, "South Chotanagpur"),
            new DistrictInfo("Palamu", 24.03, 84.07, "Palamu"),
            new DistrictInfo("Garhwa", 24.16, 83.81, "Palamu"),
            new DistrictInfo("Latehar", 23.74, 84.50, "Palamu"),
            new DistrictInfo("Hazaribagh", 23.99, 85.36, "North Chotanagpur"),
            new DistrictInfo("Ramgarh", 23.63, 85.52, "North Chotanagpur"),
            new DistrictInfo("Chatra", 24.21, 84.87, "North Chotanagpur"),
            new DistrictInfo("Koderma", 24.47, 85.59, "North Chotanagpur"),
            new DistrictInfo("Giridih", 24.18, 86.30, "North Chotanagpur"),
            new DistrictInfo("Bokaro", 23.67, 86.15, "North Chotanagpur"),
            new DistrictInfo("Dhanbad", 23.80, 86.43, "North Chotanagpur"),
            new DistrictInfo("Deoghar", 24.48, 86.70, "Santhal Pargana"),
            new DistrictInfo("Dumka", 24.27, 87.25, "Santhal Pargana"),
            new DistrictInfo("Jamtara", 23.96, 86.80, "Santhal Pargana"),
            new DistrictInfo("Godda", 24.83, 87.21, "Santhal Pargana"),
            new DistrictInfo("Sahibganj", 25.25, 87.65, "Santhal Pargana"),
            new DistrictInfo("Pakur", 24.63, 87.85, "Santhal Pargana"),
            new DistrictInfo("East Singhbhum", 22.80, 86.20, "Kolhan"),
            new DistrictInfo("West Singhbhum", 22.57, 85.82, "Kolhan"),
            new DistrictInfo("Seraikela-Kharsawan", 22.70, 85.93, "Kolhan")
    );

    public Optional<DistrictInfo> getDistrict(String name) {
        if (name == null) return Optional.empty();
        return DISTRICTS.stream()
                .filter(d -> d.getName().equalsIgnoreCase(name.trim()))
                .findFirst();
    }

    public double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public double districtDistanceKm(String a, String b) {
        Optional<DistrictInfo> da = getDistrict(a);
        Optional<DistrictInfo> db = getDistrict(b);
        if (da.isEmpty() || db.isEmpty()) return 9999.0;
        return distanceKm(da.get().getLat(), da.get().getLng(), db.get().getLat(), db.get().getLng());
    }
}
