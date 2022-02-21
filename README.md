<p align="center">
  <img src="logo-header-svg.jpg">
</p>

<p align="center">
  <a href="#introduction">Introduction & Motivation</a> •
  <a href="#limitations">Limitations</a> •
  <a href="#build">Build</a> •
    <a href="#credit-and-license">Credit and License</a> •
  <br>
</p>

## Update

This project has now bee retired and is no longer live updating.

### Introduction

This project is a web application that collates the "Areas of Expertise" that live on individual staff member profiles 
into a single page and allows them to be filtered with a free text box and department dropdown.

It is made up of a collection of web scraping python scripts which are run daily by a GitHub Action, this generates a 
JSON file. The updated file is picked up by Netlify which hosts the website.

The front end is a React web application that pulls the data out of the JSON into an HTML table.

## Limitations 

There are quite a few limitations to this work. As it is a web scraper it is dependent on the Swansea University 
website for its information, if the website structure changes it will stop working.  

At the moment it only covers the Hillary Rodham Clinton School of Law, the College of Science and the College of Arts
and Humanities, the other colleges display their staff profiles in a different structure and so will need to be added 
in time. 

---
### Build

To build this project you will need to have [Node.js](https://nodejs.org/en/) and npm installed (should come bundled 
with node). You will also  need to have [Python 3](https://www.python.org/download/releases/3.0/) installed to run 
the data scraping scripts along with a number of libraries that can be installed with pip (should come bundled with 
python).

```pip install flake8 pytest requests beautifulsoup4 datetime tqdm```

You can then run the data scraping scripts from the ```scripts``` folder using ```python scrape_data.py```.

With the JSON file generated you can generate the web application using ```npm install```, once all the requisite
dependencies are installed you can start the application using ```npm start```. This will launch the application at
```http://localhost:3000```.

## Credits and license
[MIT License](https://github.com/Legal-Innovation-Lab-Wales/expertise-directory/blob/add-license-1/LICENSE)

[Legal Innovation Lab Wales](https://legaltech.wales/) 
