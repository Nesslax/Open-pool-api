const axios = require("axios");


exports.ethgetter = async (req, res) => {
  try {



    }catch (error) {
      console.error("getter-error", error);
      return res.status(500).json({
        error: true,
        message: "getter probleme",
    });
  }
};
