# firebase-angularJS

This app will help you to display live data from Firebase database into a graphical format by Highcharts.

1) Fill in your Firebase details in index.html
2) Know your database structure: For EG --> Name_of_Dataset > value (name assigned) > any other child
3) Make sure in the last child there is a timestamp (ISO format), timestamp (epoch time in seconds), local time (epoch time in seconds + timezone difference in seconds) and 2 other values for the Y Axis (yAxisValue1, yAxisValue2)
