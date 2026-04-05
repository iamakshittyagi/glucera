from flask import Blueprint, jsonify
from glucose_stream import get_latest_reading

glucose_bp = Blueprint("glucose", __name__)

@glucose_bp.route("/glucose", methods=["GET"])
def glucose():
    reading = get_latest_reading()
    return jsonify(reading)