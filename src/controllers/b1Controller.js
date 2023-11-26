
const Axios = require("axios");
const https = require("https");
const { get, rest } = require("lodash");
const { CREDENTIALS } = require("../credentials");
const { writeUser, saveSession } = require("../helpers");
const CustomController = require("./customController");
const Controller = require("./customController");

class b1Controller {
    async test(req, res, next) {
        try {
            return res.status(201).json('ok')
        }
        catch (e) {
            return next(e)
        }
    }

    async login(req, res, next) {
        try {
            delete req.headers.host
            delete req.headers['content-length']

            let ret = await CustomController.uiLogin(req.body)
            if (ret.status !== 200 && ret.status !== 201) {
                return res.status(ret.status || 400).send({
                    "error": {
                        "message": ret.data
                    }
                });
            }

            if (ret.headers['set-cookie'] && ret.headers['set-cookie'][0]) {
                ret.headers['set-cookie'][0] += '; Path=/'
            }

            saveSession({
                ...ret.data,
                empID: ret.userData.EmployeeID,
                startedAt: (new Date).valueOf()
            })

            res.set({
                ...ret.headers
            })

            return res.status(ret.status).send(ret.data)
        }
        catch (e) {
            return next(e)
        }
    }

    async get(req, res, next) {
        try {
            let { b1Api } = req.params
            delete req.headers.host
            delete req.headers['content-length']
            if (b1Api) {
                const axios = Axios.create({
                    baseURL: "https://su26-02.sb1.cloud/",
                    timeout: 30000,
                    headers: req.headers,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                    }),
                });
                return axios
                    .get(req.originalUrl)
                    .then(({ data }) => {
                        return res.status(200).json(data);
                    })
                    .catch(async (err) => {
                        return res.status(get(err, 'response.status', 500)).json(get(err, 'response.data', `Error`))
                    });
            }
            return res.status(404).json({ status: false, message: 'B1 Api not found' })

        }
        catch (e) {
            return next(e)
        }
    }

    async post(req, res, next) {
        try {
            let { b1Api } = req.params
            delete req.headers.host
            delete req.headers['content-length']
            if (b1Api) {
                const axios = Axios.create({
                    baseURL: "https://su26-02.sb1.cloud",
                    timeout: 30000,
                    headers: req.headers,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                    }),
                });
                return axios
                    .post(req.originalUrl, req.body)
                    .then(({ data }) => {
                        return res.status(201).json(data);
                    })
                    .catch(async (err) => {
                        return res.status(get(err, 'response.status', 500)).json(get(err, 'response.data', `Error`))
                    });
            }
            return res.status(404).json({ status: false, message: 'B1 Api not found' })

        }
        catch (e) {
            return next(e)
        }
    }

    async patch(req, res, next) {
        try {
            let { b1Api } = req.params
            delete req.headers.host
            delete req.headers['content-length']
            if (b1Api) {
                const axios = Axios.create({
                    baseURL: "https://su26-02.sb1.cloud",
                    timeout: 30000,
                    headers: req.headers,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                    }),
                });
                return axios
                    .patch(req.originalUrl, req.body)
                    .then(({ data }) => {
                        return res.status(204).json(data);
                    })
                    .catch(async (err) => {
                        return res.status(get(err, 'response.status', 500)).json(get(err, 'response.data', `Error`))
                    });
            }
            return res.status(404).json({ status: false, message: 'B1 Api not found' })

        }
        catch (e) {
            return next(e)
        }
    }


}

module.exports = new b1Controller()