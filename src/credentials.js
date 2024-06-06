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
			CompanyDB: config.SAP_COMPANY_DB_DEV,
    		UserName: config.SAP_USERNAME_DEV,
    		Password: config.SAP_PASSWORD_DEV,
			Language: 24,
		},
	},
}

const xsEngineCredentials = {
	UserName: config.HANA_USER_NAME,
	Password: config.HANA_PASSWORD
}
const xsEngineUrlProd = "https://su26-02.sb1.cloud:4300/rofood-prod/"
const xsEngineMainFileProd = xsEngineUrlProd + "app.xsjs"
const xsEngineUrlDev = "https://su26-02.sb1.cloud:4300/RoFood/"
const xsEngineMainFileDev = xsEngineUrlDev + "app.xsjs"

module.exports = {
	CREDENTIALS,
	xsEngineCredentials,
	xsEngineMainFileProd
}
