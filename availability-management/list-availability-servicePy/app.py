from flask import Flask, jsonify
import mysql.connector
import os
from dotenv import load_dotenv
from flask_cors import CORS

# Update files .env
load_dotenv()

app = Flask(__name__)
CORS(app)  

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3015)
