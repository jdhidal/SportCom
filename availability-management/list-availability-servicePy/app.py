from flask import Flask, jsonify
import mysql.connector
import pika
import os
from dotenv import load_dotenv
from flask_cors import CORS
import signal
import sys

# Update files .env
load_dotenv()

app = Flask(__name__)
CORS(app)  

# Configuration global close
should_stop = False

@app.route('/availability', methods=['GET'])
def get_availability():
    try:
        
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
    global should_stop
    rabbitmq_url = os.getenv('RABBITMQ_URL')
    if not rabbitmq_url:
        print("RABBITMQ_URL environment variable is not set.")
        return

    try:
        
        parameters = pika.URLParameters(rabbitmq_url)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        
        channel.queue_declare(queue='availability_created', durable=True)
        channel.queue_declare(queue='availability_deleted', durable=True)
        channel.queue_declare(queue='availability_updated', durable=True)

        def callback(ch, method, properties, body):
            print(f"Received a message in {method.routing_key} queue: {body.decode()}")

        
        channel.basic_consume(queue='availability_created', on_message_callback=callback, auto_ack=False)

        
        channel.basic_consume(queue='availability_deleted', on_message_callback=callback, auto_ack=False)

        
        channel.basic_consume(queue='availability_updated', on_message_callback=callback, auto_ack=False)

        print('Waiting for messages. To exit press CTRL+C')

        while not should_stop:
            connection.process_data_events(time_limit=1)

    except Exception as e:
        print(f"Failed to connect to RabbitMQ: {e}")

def signal_handler(sig, frame):
    global should_stop
    should_stop = True
    print('Stopping RabbitMQ consumer...')
    sys.exit(0)

if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal_handler)
    from threading import Thread
    rabbit_thread = Thread(target=consume_messages)
    rabbit_thread.start()
    app.run(host='0.0.0.0', port=3015)
