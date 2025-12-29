import sqlite3
import datetime
from flask import Flask, request, jsonify, send_from_directory
import os

app = Flask(__name__, static_folder='.')

# Database Setup
DB_NAME = "portfolio.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize API
init_db()

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    return "File not found", 404

@app.route('/api/contact', methods=['POST'])
def save_contact():
    try:
        data = request.form
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')

        if not name or not email or not message:
            return jsonify({"error": "Missing required fields"}), 400

        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)', 
                       (name, email, message))
        conn.commit()
        conn.close()

        print(f"[{datetime.datetime.now()}] New Message from {name} ({email})")
        return jsonify({"message": "Message saved successfully"}), 200

    except Exception as e:
        print(f"Error saving contact: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

    except Exception as e:
        print(f"Error saving contact: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

if __name__ == '__main__':
    print("Starting Flask Portfolio Server...")
    print(f"Database: {os.path.abspath(DB_NAME)}")
    # Use environment variables for production configuration
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
