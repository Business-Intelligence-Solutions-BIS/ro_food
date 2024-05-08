const {config} =require("../src/configs/index");

const CREDENTIALS = {
	ROFOD_PROD: {
		url: 'https://su26-02.sb1.cloud/ServiceLayer/b1s/v2/',
		credentials: {
			CompanyDB: config.SAP_COMPANY_DB_PROD,
    		UserName: config.SAP_USERNAME_PROD,
    		Password: config.SAP_PASSWORD_PROD,
			Language: 24,
		},
	},
	ROFOD_TEST: {
		url: 'https://su26-02.sb1.cloud/ServiceLayer/b1s/v2/',
		credentials: {
			CompanyDB: config.SAP_COMPANY_DB_PROD,
    		UserName: config.SAP_USERNAME_PROD,
    		Password: config.SAP_PASSWORD_PROD,
			Language: 24,
		},
	},
}

module.exports = {
	CREDENTIALS,
}
