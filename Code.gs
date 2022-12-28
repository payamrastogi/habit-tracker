function myFunction() {
  var current_date = new Date();
  Logger.info(current_date);
  var day_of_the_month = Utilities.formatDate(new Date(), "EST", "dd");
  Logger.info(day_of_the_month);
}