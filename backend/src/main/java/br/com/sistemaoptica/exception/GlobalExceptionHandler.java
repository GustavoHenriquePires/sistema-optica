package br.com.sistemaoptica.exception;

import br.com.sistemaoptica.dto.erro.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ApiErrorResponse> tratarNaoEncontrado(
            RecursoNaoEncontradoException exception,
            HttpServletRequest request
    ) {
        return resposta(HttpStatus.NOT_FOUND, exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ApiErrorResponse> tratarRegraNegocio(
            RegraNegocioException exception,
            HttpServletRequest request
    ) {
        return resposta(HttpStatus.UNPROCESSABLE_ENTITY, exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> tratarValidacao(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        Map<String, String> erros = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                erros.putIfAbsent(error.getField(), error.getDefaultMessage())
        );

        return resposta(
                HttpStatus.BAD_REQUEST,
                "Existem campos inválidos na requisição",
                request,
                erros
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> tratarRestricoes(
            ConstraintViolationException exception,
            HttpServletRequest request
    ) {
        Map<String, String> erros = new LinkedHashMap<>();
        exception.getConstraintViolations().forEach(violation ->
                erros.put(violation.getPropertyPath().toString(), violation.getMessage())
        );
        return resposta(HttpStatus.BAD_REQUEST, "Parâmetros inválidos", request, erros);
    }

    @ExceptionHandler({
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class
    })
    public ResponseEntity<ApiErrorResponse> tratarRequisicaoInvalida(
            Exception exception,
            HttpServletRequest request
    ) {
        return resposta(
                HttpStatus.BAD_REQUEST,
                "A requisição possui formato ou valores inválidos",
                request,
                Map.of()
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> tratarIntegridade(
            DataIntegrityViolationException exception,
            HttpServletRequest request
    ) {
        return resposta(
                HttpStatus.CONFLICT,
                "A operação viola uma restrição de integridade dos dados",
                request,
                Map.of()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> tratarErroInesperado(
            Exception exception,
            HttpServletRequest request
    ) {
        return resposta(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocorreu um erro interno inesperado",
                request,
                Map.of()
        );
    }

    private ResponseEntity<ApiErrorResponse> resposta(
            HttpStatus status,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors
    ) {
        ApiErrorResponse erro = new ApiErrorResponse(
                OffsetDateTime.now(ZoneOffset.UTC),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI(),
                fieldErrors
        );
        return ResponseEntity.status(status).body(erro);
    }
}
