package com.aquat.api.exception;

import org.springframework.http.HttpStatus;


public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(String mensaje, HttpStatus status) {
        super(mensaje);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
