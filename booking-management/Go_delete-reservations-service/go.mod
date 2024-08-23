module booking-management/Go_delete-reservations-service

go 1.19

require (
	github.com/go-sql-driver/mysql v1.6.0 // Versión actual, podría variar
	github.com/gorilla/mux v1.8.0 // Para manejo de rutas (si lo usas)
	github.com/joho/godotenv v1.3.0
	github.com/streadway/amqp v1.0.0 // Si estás usando RabbitMQ con la librería amqp
)

require github.com/rs/cors v1.11.0 // direct

// Ejemplo: reemplazo de dependencias si es necesario
replace github.com/old/dependency => github.com/new/dependency v1.2.3
