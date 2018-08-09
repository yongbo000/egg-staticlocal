const egg = require('egg');
const Controller = egg.Controller;

class DispatchController extends Controller {
  async assets() {
    const { ctx } = this;
    await ctx.render('assets.html');
  }
}

module.exports = DispatchController;
