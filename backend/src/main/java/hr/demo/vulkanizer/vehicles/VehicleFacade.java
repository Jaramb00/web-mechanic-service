package hr.demo.vulkanizer.vehicles;

import java.util.List;

/** Javni ulaz u `vehicles` modul. */
public interface VehicleFacade {

    List<VehicleView> listForOwner(Long ownerId);

    /** Vraća vozilo samo ako pripada zadanom vlasniku; inače 404. */
    VehicleView getOwned(Long vehicleId, Long ownerId);

    /** Za osoblje — vozilo bez provjere vlasništva (majstor mora vidjeti auto na dizalici). */
    VehicleView getAny(Long vehicleId);

    VehicleView create(Long ownerId, VehicleRequest request);

    VehicleView update(Long vehicleId, Long ownerId, VehicleRequest request);

    void delete(Long vehicleId, Long ownerId);

    long countAll();
}
