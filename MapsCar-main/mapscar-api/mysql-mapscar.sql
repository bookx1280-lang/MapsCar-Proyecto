DROP DATABASE IF EXISTS mapscar;
CREATE DATABASE mapscar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mapscar;

CREATE TABLE Rol (
    IDrol TINYINT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Estado (
    IDestado INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Municipio (
    IDMunicipio INT AUTO_INCREMENT PRIMARY KEY,
    IDEstado INT NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    CONSTRAINT fk_municipio_estado
        FOREIGN KEY (IDEstado) REFERENCES Estado(IDestado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Tipo_Vehiculo (
    IDtipo INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    Imagen VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Marca_Vehiculo (
    IDMarca INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Modelo_Vehiculo (
    IDmodelo INT AUTO_INCREMENT PRIMARY KEY,
    IDMarca INT NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Anio YEAR NOT NULL,
    CONSTRAINT fk_modelo_marca
        FOREIGN KEY (IDMarca) REFERENCES Marca_Vehiculo(IDMarca)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT uq_modelo_marca_anio
        UNIQUE (IDMarca, Nombre, Anio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Usuario (
    IDusuario VARCHAR(50) PRIMARY KEY,
    Username VARCHAR(40) NOT NULL UNIQUE,
    Nombre VARCHAR(40) NOT NULL,
    Apellido_Paterno VARCHAR(50),
    Apellido_Materno VARCHAR(50),
    Correo VARCHAR(150) NOT NULL UNIQUE,
    Contrasena VARCHAR(255) NOT NULL,
    Estatus TINYINT DEFAULT 1,
    IDrol TINYINT NOT NULL,
    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (IDrol) REFERENCES Rol(IDrol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Vehiculo (
    IDvehiculo INT AUTO_INCREMENT PRIMARY KEY,
    IDtipo INT,
    IDMarca INT,
    IDmodelo INT,
    Rendimiento_estimado DECIMAL(5,2),
    CONSTRAINT fk_vehiculo_tipo
        FOREIGN KEY (IDtipo) REFERENCES Tipo_Vehiculo(IDtipo)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_vehiculo_marca
        FOREIGN KEY (IDMarca) REFERENCES Marca_Vehiculo(IDMarca)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_vehiculo_modelo
        FOREIGN KEY (IDmodelo) REFERENCES Modelo_Vehiculo(IDmodelo)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Gasolinera (
    IDgasolinera INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(150) NOT NULL,
    Imagen VARCHAR(255),
    Domicilio VARCHAR(255),
    Latitud DECIMAL(10,7),
    Longitud DECIMAL(10,7),
    IDEstado INT,
    IDMunicipio INT,
    CONSTRAINT fk_gasolinera_estado
        FOREIGN KEY (IDEstado) REFERENCES Estado(IDestado)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_gasolinera_municipio
        FOREIGN KEY (IDMunicipio) REFERENCES Municipio(IDMunicipio)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Puntuacion (
    IDpuntuacion INT AUTO_INCREMENT PRIMARY KEY,
    IDgasolinera INT,
    IDusuario VARCHAR(50),
    Puntuacion TINYINT UNSIGNED,
    Comentario TEXT,
    Estatus TINYINT DEFAULT 1,
    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_puntuacion_rango CHECK (Puntuacion BETWEEN 1 AND 5),
    CONSTRAINT fk_puntuacion_gas
        FOREIGN KEY (IDgasolinera) REFERENCES Gasolinera(IDgasolinera)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_puntuacion_user
        FOREIGN KEY (IDusuario) REFERENCES Usuario(IDusuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Usuario_Vehiculo (
    IDusuario VARCHAR(50),
    IDvehiculo INT,
    Color VARCHAR(50),
    Alias VARCHAR(100),
    PRIMARY KEY (IDusuario, IDvehiculo),
    CONSTRAINT fk_uv_user
        FOREIGN KEY (IDusuario) REFERENCES Usuario(IDusuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_uv_veh
        FOREIGN KEY (IDvehiculo) REFERENCES Vehiculo(IDvehiculo)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Puntuacion_Vehiculo (
    IDpuntuacion INT,
    IDvehiculo INT,
    IDgasolinera INT,
    PRIMARY KEY (IDpuntuacion, IDvehiculo, IDgasolinera),
    CONSTRAINT fk_pv_punt
        FOREIGN KEY (IDpuntuacion) REFERENCES Puntuacion(IDpuntuacion)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_pv_veh
        FOREIGN KEY (IDvehiculo) REFERENCES Vehiculo(IDvehiculo)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_pv_gas
        FOREIGN KEY (IDgasolinera) REFERENCES Gasolinera(IDgasolinera)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO Rol (IDrol, Nombre)
VALUES (1, 'Administrador'), (2, 'Usuario');
