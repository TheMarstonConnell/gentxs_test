const fs = require("fs")
const { parse } = require("csv-parse");
const converter = require("bech32-converting");
const { resolve } = require("path");
const { fail } = require("assert");
const sqlite3 = require('sqlite3').verbose();


function createBlock(address, amount, jgen) {

    let account = {
        "@type": "/cosmos.auth.v1beta1.BaseAccount",
        "address": address,
        "pub_key": null,
        "account_number": "0",
        "sequence": "0"
    }

    // console.log(isNaN(amount))

    if (isNaN(amount)) {
        return
    }

    let bal = {
        "address": address,
        "coins": [
            {
                "denom": "ujkl",
                "amount": `${Number(amount)}`
            }
        ]
    }

    
    
    jgen.app_state.auth.accounts.push(account)
    jgen.app_state.bank.balances.push(bal)
    jgen.app_state.bank.supply[0].amount = String(Number(jgen.app_state.bank.supply[0].amount) + Number(amount))

    // console.log(bal)
}



function main() {
    let gen = fs.readFileSync("genesis.json")
    let jgen = JSON.parse(gen)
    // const db = new sqlite3.Database('airdrop_oct20.sqlite');
    const db = new sqlite3.Database('backup4.sqlite');



    let failed_count = 0;
    let secret_map = {}

    db.serialize(() => {

        db.all("SELECT * FROM secret_claim", (err, rows) => {
            if (err) {
                return
            }
            for (const row of rows) {
                try {
                    secret_map[row.secret_address] = row.cosmos_address
                } catch (error) {
                }
            }

        });

        db.all("SELECT * FROM Testnet_Airdrop", (err, rows) => {
            if (err) {
                return
            }
            console.log(rows.length)
            let errCount = 0
            for (const row of rows) {
                try {
                    if (row.id == null) {
                        console.log(":(")
                        continue
                    }
                    let cosmos = secret_map[row.id]
                    if (cosmos == null || cosmos == undefined) {
                        failed_count += 1
                        continue
                    }

                    let address = converter("cosmos").toHex(cosmos)
                    address = converter("jkl").toBech32(address)
                    let amount = Math.floor(29.46375958 * 1000000)
                    createBlock(address, amount, jgen)
                } catch (error) {
                    errCount += 1
                }
            }
            console.log("testnet: " + errCount)

        });

        db.all("SELECT * FROM Cosmos_Airdrop", (err, rows) => {
            if (err) {
                return
            }
            let errCount = 0
            for (const row of rows) {
                try {
                    let address = converter("cosmos").toHex(row.id)
                    address = converter("jkl").toBech32(address)
                    let amount = Math.floor(row.drop_amount * 1000000)
                    createBlock(address, amount, jgen)
                } catch (error) {
                    errCount += 1
                }
            }
            console.log("cosmos: " + errCount)

        });

        db.all("SELECT * FROM Juno_Airdrop", (err, rows) => {
            if (err) {
                return
            }
            let errCount = 0

            for (const row of rows) {
                try {
                    let address = converter("juno").toHex(row.id)
                    address = converter("jkl").toBech32(address)
                    let amount = Math.floor(row.drop_amount * 1000000)
                    createBlock(address, amount, jgen)
                } catch (error) {
                    errCount += 1
                }
            }
            console.log("juno: " + errCount)

            console.log(failed_count)
            let amount = Math.floor(29.46375958 * 1000000) * failed_count
            console.log(amount)
            f()

        });
    });




    const f = function() {

    



    vallist = []

    gentx = jgen.app_state.genutil.gen_txs

    for (k in gentx) {
        vallist.push(gentx[k].body.messages[0].validator_address)
    }


    fs.createReadStream("./vesting.csv")
        .pipe(parse({ delimiter: ",", from_line: 1 }))
        .on("data", function (row) {
            let amt = Math.floor(Number(row[1]))
            let address = row[0]
            let years = row[2]
            address = converter("cosmos").toHex(address)
            address = converter("jkl").toBech32(address)

            // if (Number(years) == 0) {
            //     createBlock(address, amt * 1000000, jgen)
            //     return
            // }

            let vest = {
                "@type": "/cosmos.vesting.v1beta1.ContinuousVestingAccount",
                "base_vesting_account": {
                    "base_account": {
                        "account_number": "0",
                        "address": address,
                        "pub_key": null,
                        "sequence": "0"
                    },
                    "delegated_free": [],
                    "delegated_vesting": [],
                    "end_time": `${5733818 * Number(years)}`,
                    "original_vesting": [
                        {
                            "denom": "ujkl",
                            "amount": String(amt * 1000000)
                        }
                    ]
                },
                "start_time": "1"
            }

            let bank = {
                "address": address,
                "coins": [
                    {
                        "amount": String(amt * 1000000),
                        "denom": "ujkl"
                    }
                ]
            }

            let delegate = {
                "delegator_address": address,
                "starting_info": {
                    "height": "1",
                    "previous_period": "0",
                    "stake": String(amt * 1000000)
                },
                "validator_address": vallist[Math.floor(Math.random() * vallist.length)]
            }

            let notRemoved = true
            for (let k = 0; k < jgen.app_state.auth.accounts.length; k ++) {
                if(jgen.app_state.auth.accounts[k].address == address){
                    jgen.app_state.auth.accounts[k] = vest
                    notRemoved = false;
                    break;
                }
            }

            if(notRemoved) {
                jgen.app_state.auth.accounts.push(vest)
            }


            jgen.app_state.bank.balances.push(bank)

            jgen.app_state.distribution.delegator_starting_infos.push(delegate)
            jgen.app_state.bank.supply[0].amount = String(Number(jgen.app_state.bank.supply[0].amount) + (amt * 1000000))

        }).on("close", () => {
            // console.log(jgen.app_state.bank)
            let data = JSON.stringify(jgen, ' ', 4);
            fs.writeFileSync('updated_genesis.json', data);
        })
    }

}

main()