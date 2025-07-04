IF DB_ID('Bd_Proyec') IS NULL
BEGIN
    CREATE DATABASE Bd_Proyec;
END
GO

USE Bd_Proyec;
GO

-- Crear tabla cuenta
IF OBJECT_ID('cuenta', 'U') IS NOT NULL
    DROP TABLE cuenta;
GO

CREATE TABLE cuenta (
	nombre VARCHAR(30),
	contra VARCHAR(30)
);
GO

-- Insertar usuarios
INSERT INTO cuenta VALUES ('Fernanda@certus.edu.pe', 'admin1995');
INSERT INTO cuenta VALUES ('Cliente@certus.edu.pe', 'cliente123');
GO

-- Crear tabla DocumentosUsuario
IF OBJECT_ID('DocumentosUsuario', 'U') IS NOT NULL
    DROP TABLE DocumentosUsuario;
GO

CREATE TABLE DocumentosUsuario (
	id INT IDENTITY(1,1) PRIMARY KEY,
	usuario VARCHAR(50), -- opcional, si quieres saber quién los subió
	dni VARBINARY(MAX),
	certificado VARBINARY(MAX),
	fotocarnet VARBINARY(MAX),
	tipo_dni VARCHAR(50),
	tipo_certificado VARCHAR(50),
	tipo_fotocarnet VARCHAR(50)
);
GO
