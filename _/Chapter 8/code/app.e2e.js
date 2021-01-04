describe('dashboard', function() {
  beforeEach(function() {
    // Don't wait for Angular
    return browser.ignoreSynchronization = true;
  });

  it('load choropleths', function() {
    browser.get('B05166_08_Dashboard.html');

    var maps = element.all(by.css('.choropleth'));

    var result = maps.count();
    var expected = 1;

    expect(result).toEqual(expected);
  });
});