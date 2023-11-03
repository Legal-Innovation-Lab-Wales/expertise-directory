from flask import Flask, render_template, jsonify, request
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('search.html')

@app.route('/api/search')
def search():
    query = request.args.get('query')
    # Example URL, replace with actual logic to fetch and parse data
    url = f"https://www.swansea.ac.uk/search/?c=www-en-meta&q={query}&f[page type]=staff profile"
    
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract data here...
    results = []
    # Sample data structure
    results.append({'Name': 'Sample Name', 'URL': 'https://sample.url', 'Info': 'Sample Info'})

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
