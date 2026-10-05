CREATE TABLE `tarjetas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`seccion_id` integer NOT NULL,
	`texto` text NOT NULL,
	`hecho` integer DEFAULT false NOT NULL,
	`creado` integer NOT NULL,
	FOREIGN KEY (`seccion_id`) REFERENCES `secciones`(`id`) ON UPDATE no action ON DELETE cascade
);
