from flask import Flask, jsonify
import mysql.connector
import pika
import os
from dotenv import load_dotenv
from flask_cors import CORS

# Cargar variables de entorno desde el archivo .env
load_dotenv()

app = Flask(__name__)
CORS(app)  # Habilitar CORS

@app.route('/availability', methods=['GET'])
def get_availability():
    try:
        # Conectar a la base de datos MySQL
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_DATABASE')
        )
        cursor = connection.cursor(dictionary=True)
        cursor.execute('SELECT * FROM availability')
        rows = cursor.fetchall()
        return jsonify(rows), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()

def consume_messages():
    rabbitmq_url = os.getenv('RABBITMQ_URL')
    if not rabbitmq_url:
        print("RABBITMQ_URL environment variable is not set.")
        return

    try:
        # Configuración SSL
        ssl_options = {
            'ca_certs': '/path/to/ca_certificate.pem',
            'certfile': '/path/to/client_certificate.pem',
            'keyfile': '/path/to/client_key.pem'
        }

        # Configuración de conexión
        parameters = pika.URLParameters(rabbitmq_url)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        # Declarar colas con la misma configuración que ya existe
        channel.queue_declare(queue='availability_created', durable=True)
        channel.queue_declare(queue='availability_deleted', durable=True)
        channel.queue_declare(queue='availability_updated', durable=True)

        def callback(ch, method, properties, body):
            print(f"Received {body}")

        channel.basic_consume(queue='availability_created', on_message_callback=callback, auto_ack=True)
        channel.basic_consume(queue='availability_deleted', on_message_callback=callback, auto_ack=True)
        channel.basic_consume(queue='availability_updated', on_message_callback=callback, auto_ack=True)

        print('Waiting for messages. To exit press CTRL+C')
        channel.start_consuming()

    except Exception as e:
        print(f"Failed to connect to RabbitMQ: {e}")

if __name__ == '__main__':
    from threading import Thread
    rabbit_thread = Thread(target=consume_messages)
    rabbit_thread.start()
    app.run(host='0.0.0.0', port=3015)
