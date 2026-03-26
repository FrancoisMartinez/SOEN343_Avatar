package com.example.backend.foundation.config;

import com.example.backend.domain.model.AvailabilitySlot;
import com.example.backend.domain.model.Car;
import com.example.backend.domain.model.CarProvider;
import com.example.backend.domain.model.Instructor;
import com.example.backend.domain.model.Learner;
import com.example.backend.infrastructure.repository.AvailabilitySlotRepository;
import com.example.backend.infrastructure.repository.CarRepository;
import com.example.backend.infrastructure.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.DayOfWeek;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedUsersAndCars(UserRepository userRepository, CarRepository carRepository,
            AvailabilitySlotRepository availabilitySlotRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                Learner learner = new Learner();
                learner.setFullName("Test Learner");
                learner.setEmail("learner@test.com");
                learner.setPassword(passwordEncoder.encode("password123"));
                userRepository.save(learner);

                Instructor instructor = new Instructor();
                instructor.setFullName("Test Instructor");
                instructor.setEmail("instructor@test.com");
                instructor.setPassword(passwordEncoder.encode("password123"));
                userRepository.save(instructor);

                CarProvider carProvider = new CarProvider();
                carProvider.setFullName("Test Car Provider");
                carProvider.setEmail("carprovider@test.com");
                carProvider.setPassword(passwordEncoder.encode("password123"));
                userRepository.save(carProvider);

                System.out.println(
                        ">>> Seeded 3 test users (learner@test.com, instructor@test.com, carprovider@test.com / password123)");

                // Seed Cars
                Car car1 = new Car();
                car1.setMakeModel("Honda Civic");
                car1.setTransmissionType("Automatic");
                car1.setLocation("Downtown Montreal");
                car1.setLatitude(45.5017);
                car1.setLongitude(-73.5673);
                car1.setAvailable(true);
                car1.setHourlyRate(15.0);
                car1.setProvider(carProvider);

                Car car2 = new Car();
                car2.setMakeModel("Toyota Corolla");
                car2.setTransmissionType("Manual");
                car2.setLocation("Old Port Montreal");
                car2.setLatitude(45.5088);
                car2.setLongitude(-73.5540);
                car2.setAvailable(true);
                car2.setHourlyRate(12.0);
                car2.setProvider(carProvider);

                Car car3 = new Car();
                car3.setMakeModel("Ford Focus");
                car3.setTransmissionType("Automatic");
                car3.setLocation("Plateau Mont-Royal");
                car3.setLatitude(45.5200);
                car3.setLongitude(-73.5900);
                car3.setAvailable(false);
                car3.setHourlyRate(20.0);
                car3.setProvider(carProvider);

                Car car4 = new Car();
                car4.setMakeModel("Mazda 3");
                car4.setTransmissionType("Manual");
                car4.setLocation("Griffintown");
                car4.setLatitude(45.4950);
                car4.setLongitude(-73.5750);
                car4.setAvailable(true);
                car4.setHourlyRate(18.0);
                car4.setProvider(carProvider);

                carRepository.saveAll(List.of(car1, car2, car3, car4));

                // Seed availability slots for available cars (Mon-Fri 08:00-18:00, Sat 09:00-14:00 UTC)
                seedWeekdayAvailability(availabilitySlotRepository, car1);
                seedWeekdayAvailability(availabilitySlotRepository, car2);
                // car3 is unavailable — no slots
                seedWeekdayAvailability(availabilitySlotRepository, car4);

                System.out.println(">>> Seeded 4 test cars with availability for carprovider@test.com");
            }
        };
    }

    /**
     * Creates default weekly availability: Mon-Fri 08:00-18:00, Sat 09:00-14:00.
     * Times are stored as UTC minutes-from-midnight.
     */
    private void seedWeekdayAvailability(AvailabilitySlotRepository repo, Car car) {
        // Monday through Friday: 08:00 - 18:00
        for (DayOfWeek day : List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)) {
            AvailabilitySlot slot = new AvailabilitySlot();
            slot.setCar(car);
            slot.setDayOfWeek(day);
            slot.setStartMinute(8 * 60);   // 08:00
            slot.setEndMinute(18 * 60);    // 18:00
            slot.setAvailable(true);
            repo.save(slot);
        }
        // Saturday: 09:00 - 14:00
        AvailabilitySlot satSlot = new AvailabilitySlot();
        satSlot.setCar(car);
        satSlot.setDayOfWeek(DayOfWeek.SATURDAY);
        satSlot.setStartMinute(9 * 60);   // 09:00
        satSlot.setEndMinute(14 * 60);    // 14:00
        satSlot.setAvailable(true);
        repo.save(satSlot);
    }
}
