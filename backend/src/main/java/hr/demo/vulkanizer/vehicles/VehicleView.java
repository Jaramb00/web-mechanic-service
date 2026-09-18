package hr.demo.vulkanizer.vehicles;

public record VehicleView(Long id, Long ownerId, String make, String model, Integer modelYear,
                          String registration, String tireSize, String vin) {

    public String label() {
        return make + " " + model + " (" + registration + ")";
    }
}
