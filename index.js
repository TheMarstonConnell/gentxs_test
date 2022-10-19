const fs = require("fs")
const { parse } = require("csv-parse");
const converter = require("bech32-converting")

function main() {

    let gen = fs.readFileSync("genesis.json")
    let jgen = JSON.parse(gen)
    

    vallist = []

    gentx = jgen.app_state.genutil.gen_txs

    for (k in gentx) {
        vallist.push(gentx[k].body.messages[0].validator_address)
    }


    fs.createReadStream("./jkl_table.csv")
    .pipe(parse({ delimiter: ",", from_line: 1 }))
    .on("data", function (row) {
        let amt = Math.floor(Number(row[0]))
        let address = row[1]
        address = converter("cosmos").toHex(address)
        address = converter("jkl").toBech32(address)

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
                "end_time": "1000000",
                "original_vesting": [
                    {
                        "amount": String(amt),
                        "denom": "ujkl"
                    }
                ]
            },
            "start_time": "1"
        }

        let bank = {
            "address": address,
            "coins": [
                {
                    "amount": String(amt),
                    "denom": "ujkl"
                }
            ]
        }

        let delegate = {
            "delegator_address": address,
            "starting_info": {
                "height": "1",
                "previous_period": "0",
                "stake": String(amt)
            },
            "validator_address": vallist[Math.floor(Math.random() * vallist.length)]
        }

        jgen.app_state.auth.accounts.push(vest)

        jgen.app_state.bank.balances.push(bank)

        jgen.app_state.distribution.delegator_starting_infos.push(delegate)
        jgen.app_state.bank.supply[0].amount = String(Number(jgen.app_state.bank.supply[0].amount) + amt)

    }).on("close", () => {
        // console.log(jgen.app_state.bank)
        let data = JSON.stringify(jgen);
        fs.writeFileSync('updated_genesis.json', data);
    })




}

main()