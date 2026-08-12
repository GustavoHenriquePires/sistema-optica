package br.com.sistemaoptica.controller;

import br.com.sistemaoptica.dto.dashboard.DashboardResponse;
import br.com.sistemaoptica.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@Tag(name = "Dashboard", description = "Indicadores operacionais do sistema")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) { this.dashboardService = dashboardService; }

    @GetMapping
    @Operation(summary = "Obter indicadores e pedidos recentes")
    public DashboardResponse obterResumo() { return dashboardService.obterResumo(); }
}
