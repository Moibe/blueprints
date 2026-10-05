CREATE TABLE `objetivos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`seccion_id` integer NOT NULL,
	`nombre` text NOT NULL,
	`creado` integer NOT NULL,
	FOREIGN KEY (`seccion_id`) REFERENCES `secciones`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `tarjetas` ADD `objetivo_id` integer REFERENCES objetivos(id);--> statement-breakpoint
-- Datos: el texto "Siguiente objetivo" de cada sección (o "General" si no tenía pero sí tareas)
-- se vuelve su primer objetivo, y sus tareas se cuelgan de él.
INSERT INTO `objetivos` (`seccion_id`, `nombre`, `creado`)
SELECT s.`id`, COALESCE(s.`objetivo`, 'General'), s.`creado`
FROM `secciones` s
WHERE s.`objetivo` IS NOT NULL OR EXISTS (SELECT 1 FROM `tarjetas` t WHERE t.`seccion_id` = s.`id`);--> statement-breakpoint
UPDATE `tarjetas` SET `objetivo_id` = (SELECT o.`id` FROM `objetivos` o WHERE o.`seccion_id` = `tarjetas`.`seccion_id`);--> statement-breakpoint
ALTER TABLE `secciones` DROP COLUMN `objetivo`;
