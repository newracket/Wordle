import sqlite3
from datetime import datetime
from math import floor
from threading import Timer

from flask import render_template, Flask


def getCurrentWord():
    conn = sqlite3.connect("words.db")
    cursor = conn.cursor()
    w = cursor.execute(
        "SELECT word FROM wordsHistory ORDER BY time DESC LIMIT 1").fetchone()[
        0]
    conn.close()
    return w


def getWords():
    conn = sqlite3.connect("words.db")
    cursor = conn.cursor()

    conn.commit()

    cursor.execute("SELECT * FROM words")
    return cursor.fetchall()


def generateWord() -> str:
    print("Generating new word...")

    global currentWord
    conn = sqlite3.connect("words.db")
    cursor = conn.cursor()

    currentWord = \
        cursor.execute("SELECT word FROM words WHERE COMMON = 1 AND used = 0 "
                       "ORDER BY RANDOM() LIMIT 1").fetchone()[0]
    cursor.execute("UPDATE words SET used = 1 WHERE word = ?", (currentWord,))

    cursor.execute("INSERT INTO wordsHistory VALUES (?, ?)",
                   (currentWord, floor(datetime.now().timestamp())))

    conn.commit()
    conn.close()

    return currentWord


def startTimer():
    Timer(60, startTimer).start()

    conn = sqlite3.connect("words.db")
    cursor = conn.cursor()
    oldDateTimestamp = cursor.execute(
        "SELECT * FROM wordsHistory ORDER BY time DESC LIMIT 1").fetchone()[1]
    conn.close()

    oldDatetime = datetime.fromtimestamp(oldDateTimestamp)
    oldMonthDay = datetime.strftime(oldDatetime, "%m%d")
    now = datetime.now()
    newMonthDay = datetime.strftime(now, "%m%d")

    if oldMonthDay != newMonthDay:
        generateWord()


app = Flask(__name__)
currentWord = getCurrentWord()
startTimer()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/word")
def word():
    return currentWord


@app.route("/validWords")
def validWords():
    words = getWords()

    return list(map(lambda e: e[0], words))


if __name__ == "__main__":
    app.run(host="0.0.0.0")
