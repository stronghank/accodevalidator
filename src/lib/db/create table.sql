CREATE TABLE accode(
    id INT IDENTITY(1,1) PRIMARY KEY, 
    code VARCHAR(50)
);

ALTER TABLE accode ADD CONSTRAINT UQ_code UNIQUE (code);

CREATE LOGIN [accodevalidator] WITH 
    PASSWORD = 'accodevalidator',
    DEFAULT_DATABASE = [accodevalidator_UAT],
    CHECK_EXPIRATION = OFF,
    CHECK_POLICY = OFF;
GO

CREATE USER [accodevalidator] FOR LOGIN [accodevalidator];
GO

ALTER ROLE db_datareader ADD MEMBER [accodevalidator];
ALTER ROLE db_datawriter ADD MEMBER [accodevalidator];
ALTER ROLE db_ddladmin ADD MEMBER [accodevalidator];
ALTER ROLE db_owner ADD MEMBER [accodevalidator];
GO