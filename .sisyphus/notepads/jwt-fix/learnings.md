flask-jwt-extended requires identity to be a string in newer versions. Always cast user ID to string when creating tokens and back to int when retrieving if necessary.
