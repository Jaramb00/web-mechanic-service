package hr.demo.vulkanizer.vehicles;

import hr.demo.vulkanizer.common.error.DomainExceptions.ConflictException;
import hr.demo.vulkanizer.common.error.DomainExceptions.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Service
class VehicleFacadeImpl implements VehicleFacade {

    private final VehicleRepository vehicles;

    VehicleFacadeImpl(VehicleRepository vehicles) {
        this.vehicles = vehicles;
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleView> listForOwner(Long ownerId) {
        return vehicles.findByUserIdOrderByMakeAscModelAsc(ownerId).stream().map(VehicleFacadeImpl::toView).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleView getOwned(Long vehicleId, Long ownerId) {
        return toView(requireOwned(vehicleId, ownerId));
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleView getAny(Long vehicleId) {
        return vehicles.findById(vehicleId).map(VehicleFacadeImpl::toView)
                .orElseThrow(() -> new NotFoundException("Vozilo nije pronađeno."));
    }

    @Override
    @Transactional
    public VehicleView create(Long ownerId, VehicleRequest request) {
        String registration = normalize(request.registration());
        if (vehicles.existsByRegistrationIgnoreCase(registration)) {
            throw new ConflictException("Vozilo s tom registracijom već je evidentirano.");
        }
        Vehicle vehicle = new Vehicle(ownerId, request.make().trim(), request.model().trim(),
                request.modelYear(), registration, trimToNull(request.tireSize()), trimToNull(request.vin()));
        return toView(vehicles.save(vehicle));
    }

    @Override
    @Transactional
    public VehicleView update(Long vehicleId, Long ownerId, VehicleRequest request) {
        Vehicle vehicle = requireOwned(vehicleId, ownerId);
        String registration = normalize(request.registration());
        Optional<Vehicle> existing = vehicles.findByRegistrationIgnoreCase(registration);
        if (existing.isPresent() && !existing.get().getId().equals(vehicleId)) {
            throw new ConflictException("Vozilo s tom registracijom već je evidentirano.");
        }
        vehicle.update(request.make().trim(), request.model().trim(), request.modelYear(),
                registration, trimToNull(request.tireSize()), trimToNull(request.vin()));
        return toView(vehicle);
    }

    @Override
    @Transactional
    public void delete(Long vehicleId, Long ownerId) {
        Vehicle vehicle = requireOwned(vehicleId, ownerId);
        try {
            vehicles.delete(vehicle);
            vehicles.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Vozilo je vezano uz postojeće termine — brisanje bi obrisalo povijest.
            throw new ConflictException("Vozilo se ne može obrisati jer je vezano uz postojeće termine.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long countAll() {
        return vehicles.count();
    }

    private Vehicle requireOwned(Long vehicleId, Long ownerId) {
        return vehicles.findByIdAndUserId(vehicleId, ownerId)
                .orElseThrow(() -> new NotFoundException("Vozilo nije pronađeno."));
    }

    private static String normalize(String registration) {
        return registration == null ? null : registration.trim().toUpperCase().replace(" ", "");
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    static VehicleView toView(Vehicle v) {
        return new VehicleView(v.getId(), v.getUserId(), v.getMake(), v.getModel(),
                v.getModelYear(), v.getRegistration(), v.getTireSize(), v.getVin());
    }
}
