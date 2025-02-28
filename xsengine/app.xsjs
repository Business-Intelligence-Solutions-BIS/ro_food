const db = 'AE19_ROFOOD_D1'; /// testiviy

var paramName; var paramValue; var headerName; var headerValue; var contentType;  

processRequest();

function validateParams(params) {
    if (Object.keys(params).some(key => !/^[a-z0-9_\$]+$/i.test(key))) {
        throw 'Parameter names must contain letters, digits, $ and underscore only.' 
    }
}

//Implementation of GET call
function handleGet() {
    var params = getParams();
    validateParams(params);

    switch ($.request.queryPath) {
        case 'getInvoicesWithPayments':
            return handle(generateInvoicesWithPaymentsSql);
        case 'getItemsByGroups':
            return handle(generateItemsByGroupsSql);
        case 'getNewPurchaseInvoices':
            return handle(generateNewPurchaseInvoicesSql);
        case 'getItemLastPurchasePrices':
            return handle(generateItemLastPurchasePricesSql);
        case 'getItemQuantities':  // mdokon uchun
            return handle(generateItemQuantitiesSql);
        case 'getOutAndInPaymentDetails':  // mdokon uchun
            return handle(generateOutAndInPaymentDetailsSql); 
        case 'getInventarizatsiyaScanDetails':  // rofood inventerizatsiya uchun
            return handle(getInventarizatsiyaScanDetails); 
            
    }
    
    $.response.status = 404;
    return "Error: not found.";
}

function generateItemLastPurchasePricesSql({
    ItemCodes,
    pageSize,
    $skip
}) {
    let queryParams = [];
    const addSqlParams = function (...newParams) {
        queryParams = [...queryParams, ...newParams]
        return true;
    }

    const ItemCodes_ = ItemCodes && ItemCodes.replace(/^'/, "").replace(/'$/, "");
    let inParams = '';
    const itemCodesArr = ItemCodes_.split('|||');

    let inParamsCount = 200;
    
    if (itemCodesArr.length > 200) {
        inParamsCount = 1000;
    }
    if (itemCodesArr.length > 1000) {
        inParamsCount = 5000;
    }
    if (itemCodesArr.length > 5000) {
        inParamsCount = 20000;
    }

    for (let i = 0; i < inParamsCount; i++) {
        if (itemCodesArr[i]) {
            queryParams.push(itemCodesArr[i]);
        } else {
            queryParams.push(null);
        }
        
        inParams += '?';
        
        if (i < inParamsCount - 1) {
            inParams += ',';
        }
    }
    

    const query = `
        SELECT
            T0."ItemCode",
            TO_DOUBLE(T0."LastPurPrc") AS "LastPurPrc"
        FROM
            ${db}."OITM" T0
        WHERE
            T0."ItemCode" IN (${inParams})
        ORDER BY
            T0."ItemCode" ASC
        ${pageSize && addSqlParams(pageSize) ? 'LIMIT ?' : ''}
        ${$skip && addSqlParams($skip) ? 'OFFSET ?' : ''}
    `;

    return { query, queryParams };
}

function generateItemQuantitiesSql({
    WhsCode,
    pageSize,
    $skip
}) {
    let queryParams = [];
    const addSqlParams = function (...newParams) {
        queryParams = [...queryParams, ...newParams]
        return true;
    }

    const WhsCode_ = WhsCode && WhsCode.replace(/^'/, "").replace(/'$/, "");
    addSqlParams(WhsCode_);

    const query = `
        SELECT
            T0."U_MDokonId" AS "sapProductId",
            TO_DOUBLE(T1."OnHand") AS "quantity"
        FROM
            ${db}."OITM" T0
            INNER JOIN ${db}."OITW" T1 ON T0."ItemCode" = T1."ItemCode"
            INNER JOIN ${db}."OWHS" T2 ON T1."WhsCode" = T2."WhsCode"
        WHERE
          T0."frozenFor" = 'N'
          AND T0."U_MDokonId" IS NOT NULL
          AND T1."WhsCode" = ?
        ORDER BY
            T0."U_MDokonId" ASC
        ${pageSize && addSqlParams(pageSize) ? 'LIMIT ?' : ''}
        ${$skip && addSqlParams($skip) ? 'OFFSET ?' : ''}
    `;

    return { query, queryParams };
}

function generateNewPurchaseInvoicesSql({
    lastDocEntry,
    priceListNum1,
    whsCode1,
    priceListNum2,
    whsCode2,
    pageSize,
    $skip
}) {
    let queryParams = [];
    const addSqlParams = function (...newParams) {
        queryParams = [...queryParams, ...newParams]
        return true;
    }
    
    const whsCode1_ = whsCode1 && whsCode1.replace(/^'/, "").replace(/'$/, "");
    const whsCode2_ = whsCode2 && whsCode2.replace(/^'/, "").replace(/'$/, "");
    
    const query = `
        SELECT 
            TOPCH."DocEntry",
            TOPCH."DocNum",
            TO_DOUBLE(TOPCH."DocTotal") AS "DocTotal",
            TO_VARCHAR(TOPCH."DocDate", 'YYYY-MM-DD') || 'T00:00:00.000Z' AS "DocDate",
            TOCRD."CardCode",
            TOCRD."CardName",
            TOCRD."U_MDokonId" AS "MdokonSupplierId",
            TPCH1."ItemCode",
            TO_DOUBLE(TPCH1."Quantity") AS "Quantity",
            TO_DOUBLE(TPCH1."Price") AS "PurchasePrice",
            TPCH1."UomCode",
            TPCH1."UomEntry",
            TPCH1."WhsCode",
            TO_DOUBLE(TPCH1."LineTotal") AS "LineTotal",
            TOITM."ItemName",
            TOITM."U_MDokonId" AS "MdokonItemId",
            TO_DOUBLE(TITM1."Price") AS "Price",
            TOPLN."ListName"
        FROM
            (
                SELECT * FROM ${db}."OPCH"
                WHERE "DocEntry" > ${addSqlParams(lastDocEntry) && '?'}
                    AND "DocType" = 'I'
                    AND "CANCELED" = 'N'
                ORDER BY "DocEntry" ASC
                ${pageSize && addSqlParams(pageSize) ? 'LIMIT ?' : ''}
                ${$skip && addSqlParams($skip) ? 'OFFSET ?' : ''}
            ) TOPCH
        INNER JOIN ${db}."OCRD" TOCRD
            ON TOPCH."CardCode" = TOCRD."CardCode"
        INNER JOIN ${db}."PCH1" TPCH1
            ON TOPCH."DocEntry" = TPCH1."DocEntry"
        INNER JOIN ${db}."OITM" TOITM
            ON TOITM."ItemCode" = TPCH1."ItemCode"
        INNER JOIN ${db}."ITM1" TITM1
            ON TITM1."ItemCode" = TPCH1."ItemCode"
        INNER JOIN ${db}."OPLN" TOPLN
            ON TITM1."PriceList" = TOPLN."ListNum"
        WHERE
            (TOPLN."ListNum" = ${addSqlParams(priceListNum1) && '?'}
                AND TPCH1."WhsCode" = ${addSqlParams(whsCode1_) && '?'}
            )
            OR
            (TOPLN."ListNum" = ${addSqlParams(priceListNum2) && '?'}
                AND TPCH1."WhsCode" = ${addSqlParams(whsCode2_) && '?'}
            )
        ORDER BY TOPCH."DocEntry" ASC
    `

    return { query, queryParams };
}
function getInventarizatsiyaScanDetails({
    WhsCode,
    DocEntry,
    Status,
    ItmCode,
    pageSize,
    $skip
}) {
    let queryParams = [];

    const addSqlParams = function (param) {
        if (param !== '' && param !== undefined && param !== null) {
            queryParams.push(param);
            return true;
        }
        return false;
    };

    const sanitize = (str) => str && str.replace(/^'/, "").replace(/'$/, "");
    
    const DocEntry_ = sanitize(DocEntry);
    const ItmCode_ = sanitize(ItmCode);
    const Status_ = sanitize(Status);
    const WhsCode_ = sanitize(WhsCode);
    
    let query = `SELECT 
                    T1."DocEntry",
                    ROUND(T1."InWhsQty", 2) as "InWhsQty",
                    T1."LineNum",
                    T1."ItemCode", 
                    T3."ItemName", 
                    T2."WhsName", 
                    T2."WhsCode", 
                    T1."BarCode", 
                    T1."Counted", 
                    ROUND(T1."CountQty", 2) as "CountQty", 
                    T1."Difference" 
                FROM 
                    ${db}.INC1 T1 
                INNER JOIN 
                    ${db}.OWHS T2 ON T1."WhsCode" = T2."WhsCode"
                INNER JOIN 
                    ${db}.OINC T0 ON T1."DocEntry" = T0."DocEntry" 
                INNER JOIN 
                    ${db}.OITM T3 ON T1."ItemCode" = T3."ItemCode" 
                WHERE 1 = 1
                ${addSqlParams(Status_) ? 'AND T0."Status" = ?' : ''}
                ${addSqlParams(WhsCode_) ? 'AND T2."WhsCode" = ?' : ''}
                `;

    if (DocEntry_) {
    if(addSqlParams(DocEntry_)){
        query += `
             AND T1."DocEntry" = ?
            AND T1."CountQty" > 0`;}
    } else if (ItmCode_) {
        if (addSqlParams(ItmCode_)) {
            query += `
             AND lower(T1."ItemCode") LIKE lower('%' || ? || '%')`;
        }
    }

    query += `
                 ORDER BY T1."ItemCode" DESC
                ${pageSize && addSqlParams(pageSize) ? 'LIMIT ?' : ''}
                ${$skip && addSqlParams($skip) ? 'OFFSET ?' : ''}`;

    return { query, queryParams };
}


function generateItemsByGroupsSql({
    ParentGroup,
    SubGroup,
    SubSubGroup,
    ItemCode,
    ItemName,
    pageSize,
    $skip
}) {
    let queryParams = [];

    const addSqlParams = function (param) {
        if (param !== '' && param !== undefined && param !== null) {
            queryParams.push(param);
            return true;
        }
        return false;
    };
    
    const sanitize = (str) => str && str.replace(/^'/, "").replace(/'$/, "");
    
    const ParentGroup_ = sanitize(ParentGroup);
    const SubGroup_ = sanitize(SubGroup);
    const SubSubGroup_ = sanitize(SubSubGroup);
    const ItemCode_ = sanitize(ItemCode);
    const ItemName_ = sanitize(ItemName);
  
    const query = `
        SELECT 
            T3."ItemCode", 
            T3."ItemName", 
            T3."CardCode", 
            T3."OnHand" 
        FROM 
            ${db}."@UMUMIYGRUPPA" T0 
            INNER JOIN ${db}."@TEST" T1 ON T0."Code" = T1."U_UmumiyGruppa" 
            INNER JOIN ${db}.OITB T2 ON T1."Code" = T2."U_gruppa"
            INNER JOIN ${db}.OITM T3 ON T2."ItmsGrpCod" = T3."ItmsGrpCod" 
        WHERE
            1 = 1
            ${addSqlParams(ParentGroup_) ? 'AND T0."Code" = ?' : ''}
            ${addSqlParams(SubGroup_) ? 'AND T1."Code" = ?' : ''}
            ${addSqlParams(SubSubGroup_) ? 'AND T2."ItmsGrpCod" = ?' : ''}
            ${addSqlParams(ItemCode_) ? 'AND lower(T3."ItemCode") LIKE lower(\'%\' || ? || \'%\')' : ''}
            ${addSqlParams(ItemName_) ? 'AND lower(T3."ItemName") LIKE lower(\'%\' || ? || \'%\')' : ''}
        ORDER BY T3."ItemCode" DESC
        ${pageSize && addSqlParams(pageSize) ? 'LIMIT ?' : ''}
        ${$skip && addSqlParams($skip) ? 'OFFSET ?' : ''}
    `;

    return { query, queryParams };
}

function generateOutAndInPaymentDetailsSql({
    pageSize,
    $skip
}) {
    let queryParams = [];
    const addSqlParams = function (param) {
        if (param !== '' && param !== undefined && param !== null) {
            queryParams.push(param);
            return true;
        }else
        return false;
    };
        
    const query = `
            SELECT 
                T0."DocNum", 
                T0."CashAcct", 
                    (SELECT T1."AcctName" FROM ${db}.OACT T1 WHERE T0."CashAcct" = T1."AcctCode")
                AS OUTGOING,
                T0."CardCode", 
                    (SELECT T1."AcctName" FROM ${db}.OACT T1 WHERE T0."CardCode" = T1."AcctCode") 
                AS INCOMING, 
                T0."CashSum", 
                T0."DocDate", 
                T0."Comments" 
            FROM 
                ${db}.OVPM T0 
            INNER JOIN ${db}.OACT T1 
                ON T0."CashAcct" = T1."AcctCode" 
            WHERE 
                T0."DocType" = 'A' 
                ORDER BY T0."DocDate" DESC
        ${pageSize && addSqlParams(pageSize) ? 'LIMIT ?' : ''}
        ${$skip && addSqlParams($skip) ? 'OFFSET ?' : ''}
    `
    return { query, queryParams };
}

function generateInvoicesWithPaymentsSql({
    DocEntry,
    date1,
    date2,
    pageSize,
    $skip
}) {
    let queryParams = [];
    const addSqlParams = function (...newParams) {
        queryParams = [...queryParams, ...newParams]
        return true;
    }
    
    
    const date1Patched = date1 && date1.replace(/^'/,"").replace(/'$/, "");
    const date2Patched = date2 && date2.replace(/^'/,"").replace(/'$/, "");

    if (DocEntry) {
        addSqlParams(DocEntry);
    } else if (date1Patched) {
        addSqlParams(date1Patched);
        addSqlParams(date2Patched);
    }

    const query = `
        WITH TOINV AS (
            SELECT
                TOINVV."DocEntry",
                TOINVV."DocDate",
                TOINVV."DocTotal",
                TOINVV."U_InvoiceType",
                TOINVV."SlpCode",
                TOINVV."U_CashRegister"
            FROM ${db}."OINV" TOINVV
            WHERE TOINVV."CANCELED" = 'N'
            ${DocEntry
                ? `AND TOINVV."DocEntry" = ?`
                : ""
            }
            ${!DocEntry && date1Patched
                ? `AND TOINVV."DocDate" >= TO_DATS(?)
                  AND TOINVV."DocDate" <= TO_DATS(?)`
                : ""
            }
            ORDER BY TOINVV."DocEntry" DESC
            ${pageSize && addSqlParams(pageSize) ? 'LIMIT ?' : ''}
            ${$skip && addSqlParams($skip) ? 'OFFSET ?' : ''}
        )
        SELECT
            TOINV."DocEntry",
            TORCT."DocEntry" AS "ORCT.DocEntry",
            TINV1."LineNum",
            TO_DATS(TOINV."DocDate") AS "DocDate",
            CAST(TOINV."DocTotal" AS DOUBLE) AS "DocTotal",
            TOINV."U_InvoiceType",
            TOINV."SlpCode",
            TOINV."U_CashRegister",
            TINV1."Dscription",
            CAST(TINV1."Price" AS DOUBLE) AS "Price",
            CAST(TINV1."Quantity" AS DOUBLE) AS "Quantity",
            TINV1."ItemCode",
            CAST(TRCT2."SumApplied" AS DOUBLE) AS "SumApplied",
            CAST(TORCT."CashSum" AS DOUBLE) AS "CashSum",
            CAST(TORCT."DocTotal" AS DOUBLE) AS "ORCT.DocTotal",
            TORCT."CashAcct"
        FROM TOINV
        INNER JOIN ${db}.INV1 TINV1
            ON TOINV."DocEntry" = TINV1."DocEntry"
        INNER JOIN ${db}.RCT2 TRCT2
            ON TRCT2."DocEntry" = TOINV."DocEntry"
            AND TRCT2."InvType" = 13
            AND TRCT2."InstId" = 1
        INNER JOIN ${db}.ORCT TORCT
            ON TORCT."DocEntry" = TRCT2."DocNum"
            AND TORCT."Canceled" = 'N'
        ORDER BY TOINV."DocEntry" DESC
    `

    return { query, queryParams };
}

function runSql(query, queryParams) {
    let conn;

    try {
        conn = $.hdb.getConnection();
        var rs = conn.executeQuery(query, ...queryParams);
        let result = [];

        for (let i=0; i < rs.length; i++) {
            result.push(rs[i]);
        }
        
        return result;
    } catch (e) {
        $.response.status = $.net.http.BAD_REQUEST;
        throw e;
    } finally {
        if (conn) {
            conn.close();
        }
    }
}

function handle(generateSql) {
    let result = [];
    var params = getParams();
    var headers = getHeaders();

    //try {
        const preferHeader = headers.Prefer || headers.prefer
        const pageSize = parseInt(preferHeader
            && preferHeader.split('=')[1]) || 20;
        const $skip = parseInt(params.$skip) || 0;

        const nextPageParams = Object.assign(
            {},
            params,
            { $skip: $skip + pageSize }
        )
        const nextPage = buildQueryString($.request.path, nextPageParams);

        const queryParamsObj = Object.assign(
            {},
            params,
            { pageSize, nextPage }
        );

        const { query, queryParams } = generateSql(queryParamsObj);
        result = runSql(query, queryParams);
        //return JSON.stringify(queryParams);
    //} catch (e) {
    //  $.response.status = $.net.http.BAD_REQUEST;
    //  return e.message;
    //}
    
    $.response.status = $.net.http.OK;
 
    if (result.length < pageSize) {
        return {
            value: result
        };
    }

    return {
        value: result,
        "@odata.nextLink": nextPage
    };
}

function processRequest(){
    try {
        switch ( $.request.method ) {
            //Handle your GET calls here
            case $.net.http.GET:
                $.response.setBody(JSON.stringify(handleGet()));
                break;
                //Handle your POST calls here
            case $.net.http.POST:
                $.response.setBody(JSON.stringify(handlePost()));
                break; 
            //Handle your other methods: PUT, DELETE
            default:
                $.response.status = $.net.http.METHOD_NOT_ALLOWED;
                $.response.setBody("Wrong request method");             
                break;
        }
        $.response.contentType = "application/json";        
    } catch (e) {
        $.response.setBody("Failed to execute action: " + e.toString());
    }
}

function getHeaders() {
    let headers = {};

    for (var i = 0; i < $.request.headers.length; ++i) {
        const name = $.request.headers[i].name;
        const value = $.request.headers[i].value;
        headers[name] = value;     
    }
    
    return headers;
}

function getParams() {
    let params = {};

    for (var i = 0; i < $.request.parameters.length; ++i) {
        const name = $.request.parameters[i].name;
        const value = $.request.parameters[i].value;
        params[name] = value;     
    }
   
    return params;
}


/**
 * Builds a query string from an object of parameters.
 * @param {string} url - The base URL.
 * @param {Object} parameters - An object containing key-value pairs for query parameters.
 * @returns {string} - The complete URL with query string.
 */
function buildQueryString(url, parameters) {
    let queryString = '';
    for (let key in parameters) {
        const value = parameters[key];
        queryString += encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&';
    }
    if (queryString.length > 0) {
        queryString = queryString.substring(0, queryString.length - 1); // Remove the trailing "&"
        url += '?' + queryString;
    }
    return url;
}
