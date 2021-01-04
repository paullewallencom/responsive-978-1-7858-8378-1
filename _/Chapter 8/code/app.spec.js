var expect = chai.expect;

describe('app', function() {
  describe('#flatten()', function () {

    it('should flatten an nested array', function () {
      var arr = [['foo'], ['bar']];

      var expected = ['foo', 'bar'];
      var result = flatten(arr);

      expect(result).to.eql(expected);
    });
  });
});