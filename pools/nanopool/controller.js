const axios = require("axios");


exports.ethgetter = async (req, res) => {
  try {

      const url="https://api.nanopool.org/v1/"+req.params.coin+"/balance/"+req.params.adress
      let response = await axios.get(url);


      console.log(response)

      return res.status(200).json({
        success: true,
        balance: response.data.data,
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
