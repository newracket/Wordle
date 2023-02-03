from datetime import datetime
from json import loads, dumps
from random import choice
from threading import Timer

from flask import Flask, render_template

app = Flask(__name__)
words = loads(open("static/words.json").read())
wordsHistory = loads(open("wordsHistory.json").read())
currentWord = wordsHistory["words"][0]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/word")
def word():
    return currentWord


def generateWord() -> str:
    print("Generating new word...")

    global currentWord
    currentWord = choice(words)
    while currentWord in wordsHistory["words"]:
        currentWord = choice(words)

    wordsHistory["words"].insert(0, currentWord)
    wordsHistory["lastUpdated"] = datetime.now().timestamp()
    open("wordsHistory.json", "w").write(dumps(wordsHistory))

    return currentWord


def startTimer():
    Timer(60, startTimer).start()

    oldDatetime = datetime.fromtimestamp(wordsHistory["lastUpdated"])
    oldMonthDay = datetime.strftime(oldDatetime, "%m%d")

    now = datetime.now()
    newMonthDay = datetime.strftime(now, "%m%d")

    if oldMonthDay != newMonthDay:
        generateWord()


startTimer()
if len(wordsHistory["words"]) == 0:
    generateWord()

if __name__ == "__main__":
    app.run(debug=True)
