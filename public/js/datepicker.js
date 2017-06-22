$(function() {
	$( "#date" ).datepicker({ 
		dateFormat: 'dd-mm-yy',
		changeMonth: true,
		changeYear: true,
		buttonImage: "../img/calendar.gif",
		buttonImageOnly: true,
		buttonText: "Select date",
		showOn: "button",
		minDate: "-100Y",
		yearRange: "1950:2017"
	}); 
});