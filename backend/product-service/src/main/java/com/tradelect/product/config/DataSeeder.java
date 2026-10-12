package com.tradelect.product.config;

import com.tradelect.product.model.Product;
import com.tradelect.product.model.StockStatus;
import com.tradelect.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) return; // already seeded

        log.info("Seeding sample products...");

        List<Product> products = List.of(
            Product.builder()
                .name("Siemens 3RT2 Contactor 9A 4kW")
                .partNumber("3RT2015-1BB41")
                .brand("Siemens")
                .category("Contactors & Relays")
                .subCategory("Power Contactors")
                .modelNumber("3RT2015")
                .description("Siemens SIRIUS 3RT2 contactor, 9A, 4kW/400V, 24V DC coil, 3NO+1NO auxiliary.")
                .price(new BigDecimal("1850.00"))
                .discountPrice(new BigDecimal("1620.00"))
                .stockQuantity(150)
                .stockStatus(StockStatus.IN_STOCK)
                .sellerId(1L)
                .specifications(Map.of("Rated Current","9A","Rated Power","4kW","Coil Voltage","24V DC","Poles","3","Auxiliary","1NO"))
                .imageUrls(List.of("https://placehold.co/400x300?text=Siemens+Contactor"))
                .rating(4.5)
                .reviewCount(42)
                .build(),

            Product.builder()
                .name("ABB A9-30-10 Contactor 9A")
                .partNumber("1SBL141001R8010")
                .brand("ABB")
                .category("Contactors & Relays")
                .subCategory("Power Contactors")
                .modelNumber("A9-30-10")
                .description("ABB A-Line contactor 9A, 4kW/400V, 230V AC coil, 3NO main + 1NO auxiliary.")
                .price(new BigDecimal("1920.00"))
                .stockQuantity(80)
                .stockStatus(StockStatus.IN_STOCK)
                .sellerId(1L)
                .specifications(Map.of("Rated Current","9A","Rated Power","4kW","Coil Voltage","230V AC","Standard","IEC 60947-4-1"))
                .imageUrls(List.of("https://placehold.co/400x300?text=ABB+Contactor"))
                .rating(4.3)
                .reviewCount(28)
                .build(),

            Product.builder()
                .name("Schneider Electric iC60N MCB 16A 2P")
                .partNumber("A9F74216")
                .brand("Schneider Electric")
                .category("MCBs & MCCBs")
                .subCategory("Miniature Circuit Breakers")
                .modelNumber("iC60N")
                .description("Acti 9 iC60N 2-pole MCB 16A C-curve, IEC 60898-1, 6kA breaking capacity.")
                .price(new BigDecimal("680.00"))
                .discountPrice(new BigDecimal("595.00"))
                .stockQuantity(500)
                .stockStatus(StockStatus.IN_STOCK)
                .sellerId(1L)
                .specifications(Map.of("Poles","2P","Rated Current","16A","Curve","C","Breaking Capacity","6kA","Standard","IEC 60898-1"))
                .imageUrls(List.of("https://placehold.co/400x300?text=Schneider+MCB"))
                .rating(4.7)
                .reviewCount(95)
                .build(),

            Product.builder()
                .name("Siemens SINAMICS G120 VFD 1.5kW")
                .partNumber("6SL3210-1KE14-3UF1")
                .brand("Siemens")
                .category("Drives & Automation")
                .subCategory("Variable Frequency Drives")
                .modelNumber("SINAMICS G120")
                .description("SINAMICS G120 power module PM240-2, 1.5kW, 380-480V 3AC, integrated filter.")
                .price(new BigDecimal("18500.00"))
                .discountPrice(new BigDecimal("16200.00"))
                .stockQuantity(30)
                .stockStatus(StockStatus.IN_STOCK)
                .sellerId(1L)
                .specifications(Map.of("Power","1.5kW","Voltage","380-480V 3AC","Frame Size","FSA","IP Rating","IP20","Communication","PROFIBUS"))
                .imageUrls(List.of("https://placehold.co/400x300?text=Siemens+VFD"))
                .rating(4.8)
                .reviewCount(17)
                .build(),

            Product.builder()
                .name("ABB ACS580 Drive 7.5kW")
                .partNumber("ACS580-01-017A-4")
                .brand("ABB")
                .category("Drives & Automation")
                .subCategory("Variable Frequency Drives")
                .modelNumber("ACS580")
                .description("ABB ACS580 general purpose drive 7.5kW, 400V, built-in EMC filter Class C2.")
                .price(new BigDecimal("38000.00"))
                .stockQuantity(15)
                .stockStatus(StockStatus.IN_STOCK)
                .sellerId(1L)
                .specifications(Map.of("Power","7.5kW","Voltage","380-480V","IP Rating","IP21","Control","Direct Torque Control","Communication","Modbus RTU"))
                .imageUrls(List.of("https://placehold.co/400x300?text=ABB+ACS580"))
                .rating(4.6)
                .reviewCount(12)
                .build(),

            Product.builder()
                .name("Legrand DX3 RCCB 63A 30mA 4P")
                .partNumber("411670")
                .brand("Legrand")
                .category("Switchgear")
                .subCategory("RCCBs")
                .modelNumber("DX3")
                .description("Legrand DX3 Residual Current Circuit Breaker, 4-pole, 63A, 30mA sensitivity, Type AC.")
                .price(new BigDecimal("3200.00"))
                .discountPrice(new BigDecimal("2850.00"))
                .stockQuantity(200)
                .stockStatus(StockStatus.IN_STOCK)
                .sellerId(1L)
                .specifications(Map.of("Poles","4P","Rated Current","63A","Sensitivity","30mA","Type","AC","Breaking Capacity","6kA"))
                .imageUrls(List.of("https://placehold.co/400x300?text=Legrand+RCCB"))
                .rating(4.4)
                .reviewCount(33)
                .build(),

            Product.builder()
                .name("Siemens SIMATIC S7-1200 PLC CPU 1214C")
                .partNumber("6ES7214-1AG40-0XB0")
                .brand("Siemens")
                .category("PLC & HMI")
                .subCategory("Programmable Logic Controllers")
                .modelNumber("SIMATIC S7-1200")
                .description("SIMATIC S7-1200 CPU 1214C DC/DC/DC, 14DI/10DO/2AI, 75KB work memory, PROFINET.")
                .price(new BigDecimal("28500.00"))
                .discountPrice(new BigDecimal("25800.00"))
                .stockQuantity(25)
                .stockStatus(StockStatus.IN_STOCK)
                .sellerId(1L)
                .specifications(Map.of("Work Memory","75KB","DI","14","DO","10","AI","2","Communication","PROFINET","Supply Voltage","24V DC"))
                .imageUrls(List.of("https://placehold.co/400x300?text=Siemens+PLC"))
                .rating(4.9)
                .reviewCount(8)
                .build(),

            Product.builder()
                .name("Havells 32A TPN MCB SP+N 10kA")
                .partNumber("DHMGCSPE032")
                .brand("Havells")
                .category("MCBs & MCCBs")
                .subCategory("Miniature Circuit Breakers")
                .modelNumber("SPN MCB")
                .description("Havells TPN MCB 32A Single Pole + Neutral, C-curve, 10kA, DIN rail mount.")
                .price(new BigDecimal("420.00"))
                .stockQuantity(1000)
                .stockStatus(StockStatus.IN_STOCK)
                .sellerId(1L)
                .specifications(Map.of("Poles","SP+N","Rated Current","32A","Curve","C","Breaking Capacity","10kA"))
                .imageUrls(List.of("https://placehold.co/400x300?text=Havells+MCB"))
                .rating(4.2)
                .reviewCount(62)
                .build()
        );

        productRepository.saveAll(products);
        log.info("Seeded {} sample products", products.size());
    }
}
