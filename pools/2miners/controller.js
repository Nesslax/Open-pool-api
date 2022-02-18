const axios = require("axios");


exports.ethgetter = async (req, res) => {
  try {

      const url="https://"+req.params.coin+".2miners.com/api/accounts/"+req.params.adress
      let response = await axios.get(url);


      console.log(response)

      return res.status(200).json({
        success: true,
        balance: response.stats.balance,
        valuebalence:"",
        prevision24h:"",
        previsionbalancemonth:"",
      });

    }catch (error) {
      console.error("getter-error", error);
      return res.status(500).json({
        error: true,
        message: "getter probleme",
    });
  }
};
