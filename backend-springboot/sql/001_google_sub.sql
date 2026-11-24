USE aquat;

ALTER TABLE usuarios
ADD COLUMN google_sub VARCHAR(255) NULL,
ADD CONSTRAINT uk_usuarios_google_sub UNIQUE (google_sub);