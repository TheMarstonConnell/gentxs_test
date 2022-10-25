const fs = require("fs")


function main() {
    let gen = fs.readFileSync("genesis.json")
    let jgen = JSON.parse(gen)

    gentx = jgen.app_state.genutil.gen_txs
    peers = ""


    for (k in gentx) {
        peers = `${peers}${gentx[k].body.memo}\n`
    }

    console.log(peers)



    fs.writeFileSync('peers.txt', peers);
}

main()