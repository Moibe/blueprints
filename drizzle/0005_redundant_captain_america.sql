PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tarjetas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`objetivo_id` integer NOT NULL,
	`texto` text NOT NULL,
	`hecho` integer DEFAULT false NOT NULL,
	`logrado` integer,
	`creado` integer NOT NULL,
	FOREIGN KEY (`objetivo_id`) REFERENCES `objetivos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tarjetas`("id", "objetivo_id", "texto", "hecho", "logrado", "creado") SELECT "id", "objetivo_id", "texto", "hecho", "logrado", "creado" FROM `tarjetas`;--> statement-breakpoint
DROP TABLE `tarjetas`;--> statement-breakpoint
ALTER TABLE `__new_tarjetas` RENAME TO `tarjetas`;--> statement-breakpoint
PRAGMA foreign_keys=ON;