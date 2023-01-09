#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pickle
from flask import Flask, request, render_template
import numpy as np
import re
loaded_vectorizer = pickle.load(open('vectorizer.pkl','rb')) 
loaded_model = pickle.load(open('model.pkl','rb')) 
app = Flask(__name__)


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/p', methods=['POST'])
def predict():
    if request.method == 'POST':
        output = request.form.to_dict()
        Subject = output['subj']
        Body = output['body']
        
        message = " ".join([Subject, Body])
        
        if message == ' ' : 
            return render_template('index.html', pred="Copy and Paste an Email, before Clicking 'PREDICT'.")
        
        else :
            #  Text Cleaning steps made in JavaScript while extracting Emaiuls
            message = re.sub(r"\s", " ", message)
            message = re.sub(r'''(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))''', " ", message)
            message = re.sub(r"\W", " ", message)
            message = re.sub(' +', ' ', message)
            message = message.lower()
            
            #  Text Cleaning steps made in Python
            message = " ".join(filter( lambda x: len(x) < 23 , message.split(" ")))
            
            #  Converting string to Array
            message = np.array([message], dtype='object')
            
            #  Vectorizer 
            message_dtm = loaded_vectorizer.transform(message).toarray()
            
            #  Predicting through trained model
            prediction = loaded_model.predict(message_dtm.reshape(1, -1))[0]
            
            Dict = {0:'PRIMARY', 1:'SOCIAL', 2:'PROMOTIONS', 3:'UPDATES'}
            
            return render_template('index.html', pred=Dict[prediction])


if __name__=='__main__':
    app.run(host="127.0.0.1", port=8080, debug=True)

