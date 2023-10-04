
const Axios = require("axios");
const https = require("https");
const { get, rest } = require("lodash");

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
            const axios = Axios.create({
                baseURL: "https://su26-02.sb1.cloud/ServiceLayer/b1s/v1/",
                timeout: 30000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false,
                }),
            });
            return axios.post("/Login", req.body).then(({ data }) => {
                return res.status(200).json(data);
            }).catch(err => {
                return res.status(get(err, 'response.status', 500)).json(get(err, 'response.data', `Error`))
            });
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
                    baseURL: "https://su26-02.sb1.cloud/ServiceLayer/b1s/v1/",
                    timeout: 30000,
                    headers: req.headers,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                    }),
                });
                return axios
                    .get(b1Api)
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
                    baseURL: "https://su26-02.sb1.cloud/ServiceLayer/b1s/v1/",
                    timeout: 30000,
                    headers: req.headers,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                    }),
                });
                return axios
                    .post(b1Api, req.body)
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
                    baseURL: "https://su26-02.sb1.cloud/ServiceLayer/b1s/v1/",
                    timeout: 30000,
                    headers: req.headers,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                    }),
                });
                return axios
                    .patch(b1Api, req.body)
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