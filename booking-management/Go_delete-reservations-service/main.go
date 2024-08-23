package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/streadway/amqp"
)

func init() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}
}

func main() {
	router := mux.NewRouter()

	// Servir el archivo Swagger YAML
	router.PathPrefix("/api-docs/").Handler(http.StripPrefix("/api-docs/", http.FileServer(http.Dir("./"))))

	// Endpoint para eliminar una reservación
	router.HandleFunc("/reservations/{id}", deleteReservationHandler).Methods("DELETE")

	// Configura el middleware CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3021"}, // Reemplaza con tu origen
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3010" // Puerto por defecto si no se especifica
	}

	log.Printf("Service running on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), corsHandler.Handler(router)))
}

func deleteReservationHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	reservationId := vars["id"]

	log.Printf("Attempting to delete reservation with ID: %s", reservationId)

	db, err := connectToDatabase()
	if err != nil {
		log.Printf("Database connection failed: %v", err)
		http.Error(w, "Database connection failed", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Ejecutar procedimiento almacenado
	_, err = db.Exec("CALL DeleteReservation(?)", reservationId)
	if err != nil {
		log.Printf("Failed to execute stored procedure: %v", err)
		http.Error(w, "Failed to delete reservation", http.StatusInternalServerError)
		return
	}

	// Enviar mensaje a RabbitMQ
	err = sendMessageToRabbitMQ(reservationId)
	if err != nil {
		log.Printf("Failed to send message to RabbitMQ: %v", err)
		http.Error(w, "Failed to send message to RabbitMQ", http.StatusInternalServerError)
		return
	}

	log.Printf("Reservation %s deleted successfully", reservationId)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Reservation deleted"})
}

func connectToDatabase() (*sql.DB, error) {
	dbConfig := fmt.Sprintf("%s:%s@tcp(%s)/%s",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_DATABASE"),
	)
	db, err := sql.Open("mysql", dbConfig)
	if err != nil {
		log.Printf("Error opening database: %v", err)
		return nil, err
	}

	// Verifica la conexión
	err = db.Ping()
	if err != nil {
		log.Printf("Error pinging database: %v", err)
		return nil, err
	}

	log.Println("Successfully connected to the database")
	return db, nil
}

func sendMessageToRabbitMQ(reservationId string) error {
	conn, err := amqp.Dial(os.Getenv("RABBITMQ_URL"))
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ: %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open a channel: %v", err)
	}
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"reservation_deleted", // Nombre de la cola
		true,                  // Durable
		false,                 // Borrar cuando no esté en uso
		false,                 // Exclusivo
		false,                 // No esperar
		nil,                   // Argumentos
	)
	if err != nil {
		return fmt.Errorf("failed to declare a queue: %v", err)
	}

	body := fmt.Sprintf(`{"reservationId": "%s"}`, reservationId)
	err = ch.Publish(
		"",     // Exchange
		q.Name, // Clave de enrutamiento
		false,  // Obligatorio
		false,  // Inmediato
		amqp.Publishing{
			ContentType: "application/json",
			Body:        []byte(body),
		})
	if err != nil {
		return fmt.Errorf("failed to publish a message: %v", err)
	}

	log.Printf("Message sent to RabbitMQ: %s", body)
	return nil
}
