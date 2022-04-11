window.addEventListener('load', loaded)

let gapi = "https://apis.google.com/js/api.js"

function loadClient() {
  gapi.client.setApiKey("YOUR_API_KEY");
  return gapi.client.load("https://civicinfo.googleapis.com/$discovery/rest?version=v2")
      .then(function () { console.log("GAPI client loaded for API"); },
          function (err) { console.error("Error loading GAPI client for API", err); });
}
// Make sure the client is loaded before calling this method.
function execute() {
  return gapi.client.civicinfo.representatives.representativeInfoByAddress({
      "address": "1311 E Chambers St, Milwaukee, WI 53212",
      "includeOffices": true,
      "levels": [
          "administrativeArea2",
          "administrativeArea1",
          "country",
          "regional",
          "locality"
      ]
  })
      .then(function (response) {
          // Handle the results here (response.result has the parsed body).
          console.log("Response", response);
      },
          function (err) { console.error("Execute error", err); });
}

function loaded() {
    let listParentDiv = document.getElementById('listOfOfficials')
    let parsedJSON = JSON.parse(sampleJSON)
    let divisions = parsedJSON['divisions']
    let offices = parsedJSON['offices']
    let officials = parsedJSON['officials']

    // document.body.innerHTML += `<p>Count of officals: ${officials.length}<p>`

    console.log(parsedJSON)
    // listParentDiv.innerHTML += `<li>${usa.name}</li>`

    for (div in divisions) {
      let divName = divisions[div].name
      listParentDiv.innerHTML += `
        <li><h2>${divName}</h2></li>
        `

        let foundOffices = offices.filter(o => o.divisionId === div)
        foundOffices.forEach(office => {
            listParentDiv.innerHTML += `<li><strong>${office.name}</strong></li>`
            let indices = office.officialIndices
            indices.forEach(ind => {
              let official = officials[ind]
              let officialName = official.name
              let officalURLs = official.urls

              listParentDiv.innerHTML += `
              <li>${official.name} 
              ${ officalURLs ? `<a href="${official.urls[0]}">website</a>` : ''}
              `
            });
        });
    }

    for (let index = 0; index < offices.length; index++) {
        // const office = offices[index]
        // listParentDiv.innerHTML += `
        // <li>${office.name}</li>
        // `
        // let officialsIndicies = divisions[office.divisionId].officeIndices
        // console.log(officialsIndicies)
        // for (indicie in officialsIndicies) {
        //   const element = officials[indicie]
        //   listParentDiv.innerHTML += `
        //     <li><span><strong>${element.name}</strong><span> <a href=${element.urls[0]} >Website</a></li>
        // `
        // }
    }
}


let sampleJSON = `
{
  "normalizedInput": {
    "line1": "1311 East Chambers Street",
    "city": "Milwaukee",
    "state": "WI",
    "zip": "53212"
  },
  "kind": "civicinfo#representativeInfoResponse",
  "divisions": {
    "ocd-division/country:us/state:wi/place:milwaukee": {
      "name": "Milwaukee city",
      "officeIndices": [
        19,
        20,
        21,
        22
      ]
    },
    "ocd-division/country:us/state:wi": {
      "name": "Wisconsin",
      "officeIndices": [
        2,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ]
    },
    "ocd-division/country:us": {
      "name": "United States",
      "officeIndices": [
        0,
        1
      ]
    },
    "ocd-division/country:us/state:wi/cd:4": {
      "name": "Wisconsin's 4th congressional district",
      "officeIndices": [
        3
      ]
    },
    "ocd-division/country:us/state:wi/county:milwaukee": {
      "name": "Milwaukee County",
      "officeIndices": [
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18
      ]
    }
  },
  "offices": [
    {
      "name": "President of the United States",
      "divisionId": "ocd-division/country:us",
      "levels": [
        "country"
      ],
      "roles": [
        "headOfGovernment",
        "headOfState"
      ],
      "officialIndices": [
        0
      ]
    },
    {
      "name": "Vice President of the United States",
      "divisionId": "ocd-division/country:us",
      "levels": [
        "country"
      ],
      "roles": [
        "deputyHeadOfGovernment"
      ],
      "officialIndices": [
        1
      ]
    },
    {
      "name": "U.S. Senator",
      "divisionId": "ocd-division/country:us/state:wi",
      "levels": [
        "country"
      ],
      "roles": [
        "legislatorUpperBody"
      ],
      "officialIndices": [
        2,
        3
      ]
    },
    {
      "name": "U.S. Representative",
      "divisionId": "ocd-division/country:us/state:wi/cd:4",
      "levels": [
        "country"
      ],
      "roles": [
        "legislatorLowerBody"
      ],
      "officialIndices": [
        4
      ]
    },
    {
      "name": "Governor of Wisconsin",
      "divisionId": "ocd-division/country:us/state:wi",
      "levels": [
        "administrativeArea1"
      ],
      "roles": [
        "headOfGovernment"
      ],
      "officialIndices": [
        5
      ]
    },
    {
      "name": "Lieutenant Governor of Wisconsin",
      "divisionId": "ocd-division/country:us/state:wi",
      "levels": [
        "administrativeArea1"
      ],
      "roles": [
        "deputyHeadOfGovernment"
      ],
      "officialIndices": [
        6
      ]
    },
    {
      "name": "WI State Treasurer",
      "divisionId": "ocd-division/country:us/state:wi",
      "levels": [
        "administrativeArea1"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        7
      ]
    },
    {
      "name": "WI Attorney General",
      "divisionId": "ocd-division/country:us/state:wi",
      "levels": [
        "administrativeArea1"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        8
      ]
    },
    {
      "name": "WI Secretary of State",
      "divisionId": "ocd-division/country:us/state:wi",
      "levels": [
        "administrativeArea1"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        9
      ]
    },
    {
      "name": "WI Superintendent of Public Instruction",
      "divisionId": "ocd-division/country:us/state:wi",
      "levels": [
        "administrativeArea1"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        10
      ]
    },
    {
      "name": "WI Supreme Court Justice",
      "divisionId": "ocd-division/country:us/state:wi",
      "levels": [
        "administrativeArea1"
      ],
      "roles": [
        "judge"
      ],
      "officialIndices": [
        11,
        12,
        13,
        14,
        15,
        16,
        17
      ]
    },
    {
      "name": "Milwaukee County Executive",
      "divisionId": "ocd-division/country:us/state:wi/county:milwaukee",
      "levels": [
        "administrativeArea2"
      ],
      "roles": [
        "headOfGovernment"
      ],
      "officialIndices": [
        18
      ]
    },
    {
      "name": "Milwaukee County Register of Deeds",
      "divisionId": "ocd-division/country:us/state:wi/county:milwaukee",
      "levels": [
        "administrativeArea2"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        19
      ]
    },
    {
      "name": "Milwaukee County Sheriff",
      "divisionId": "ocd-division/country:us/state:wi/county:milwaukee",
      "levels": [
        "administrativeArea2"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        20
      ]
    },
    {
      "name": "Milwaukee County Clerk",
      "divisionId": "ocd-division/country:us/state:wi/county:milwaukee",
      "levels": [
        "administrativeArea2"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        21
      ]
    },
    {
      "name": "Milwaukee County Treasurer",
      "divisionId": "ocd-division/country:us/state:wi/county:milwaukee",
      "levels": [
        "administrativeArea2"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        22
      ]
    },
    {
      "name": "Milwaukee County Comptroller",
      "divisionId": "ocd-division/country:us/state:wi/county:milwaukee",
      "levels": [
        "administrativeArea2"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        23
      ]
    },
    {
      "name": "Milwaukee County Clerk of Circuit Court",
      "divisionId": "ocd-division/country:us/state:wi/county:milwaukee",
      "levels": [
        "administrativeArea2"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        24
      ]
    },
    {
      "name": "Milwaukee County District Attorney",
      "divisionId": "ocd-division/country:us/state:wi/county:milwaukee",
      "levels": [
        "administrativeArea2"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        25
      ]
    },
    {
      "name": "Mayor of Milwaukee",
      "divisionId": "ocd-division/country:us/state:wi/place:milwaukee",
      "levels": [
        "locality"
      ],
      "roles": [
        "headOfGovernment"
      ],
      "officialIndices": [
        26
      ]
    },
    {
      "name": "Milwaukee City Attorney",
      "divisionId": "ocd-division/country:us/state:wi/place:milwaukee",
      "levels": [
        "locality"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        27
      ]
    },
    {
      "name": "Milwaukee City Comptroller",
      "divisionId": "ocd-division/country:us/state:wi/place:milwaukee",
      "levels": [
        "locality"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        28
      ]
    },
    {
      "name": "Milwaukee City Treasurer",
      "divisionId": "ocd-division/country:us/state:wi/place:milwaukee",
      "levels": [
        "locality"
      ],
      "roles": [
        "governmentOfficer"
      ],
      "officialIndices": [
        29
      ]
    }
  ],
  "officials": [
    {
      "name": "Joseph R. Biden",
      "address": [
        {
          "line1": "1600 Pennsylvania Avenue Northwest",
          "city": "Washington",
          "state": "DC",
          "zip": "20500"
        }
      ],
      "party": "Democratic Party",
      "phones": [
        "(202) 456-1111"
      ],
      "urls": [
        "https://www.whitehouse.gov/",
        "https://en.wikipedia.org/wiki/Joe_Biden"
      ],
      "channels": [
        {
          "type": "Twitter",
          "id": "potus"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "The White House 1600 Pennsylvania Avenue NW Washington, DC 20500",
          "featureId": {
            "cellId": "9923602325795527449",
            "fprint": "11513381022022344111"
          },
          "featureType": "typeCompoundBuilding",
          "positionPrecisionMeters": 126.14545494347092,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Kamala D. Harris",
      "address": [
        {
          "line1": "1600 Pennsylvania Avenue Northwest",
          "city": "Washington",
          "state": "DC",
          "zip": "20500"
        }
      ],
      "party": "Democratic Party",
      "phones": [
        "(202) 456-1111"
      ],
      "urls": [
        "https://www.whitehouse.gov/",
        "https://en.wikipedia.org/wiki/Kamala_Harris"
      ],
      "channels": [
        {
          "type": "Twitter",
          "id": "VP"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "The White House 1600 Pennsylvania Avenue NW Washington, DC 20500",
          "featureId": {
            "cellId": "9923602325795527449",
            "fprint": "11513381022022344111"
          },
          "featureType": "typeCompoundBuilding",
          "positionPrecisionMeters": 126.14545494347092,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Ron Johnson",
      "address": [
        {
          "line1": "328 Hart Senate Office Building",
          "city": "Washington",
          "state": "DC",
          "zip": "20510"
        }
      ],
      "party": "Republican Party",
      "phones": [
        "(202) 224-5323"
      ],
      "urls": [
        "https://www.ronjohnson.senate.gov/",
        "https://en.wikipedia.org/wiki/Ron_Johnson_%28Wisconsin_politician%29"
      ],
      "photoUrl": "http://bioguide.congress.gov/bioguide/photo/J/J000293.jpg",
      "channels": [
        {
          "type": "Facebook",
          "id": "senronjohnson"
        },
        {
          "type": "Twitter",
          "id": "SenRonJohnson"
        },
        {
          "type": "YouTube",
          "id": "SenatorRonJohnson"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "328 Hart Senate Office Building, Washington DC 20510",
          "featureId": {
            "cellId": "9923602661160726555",
            "fprint": "13491012159388313795"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": false
        }
      ]
    },
    {
      "name": "Tammy Baldwin",
      "address": [
        {
          "line1": "709 Hart Senate Office Building",
          "city": "Washington",
          "state": "DC",
          "zip": "20510"
        }
      ],
      "party": "Democratic Party",
      "phones": [
        "(202) 224-5653"
      ],
      "urls": [
        "https://www.baldwin.senate.gov/",
        "https://en.wikipedia.org/wiki/Tammy_Baldwin"
      ],
      "photoUrl": "http://bioguide.congress.gov/bioguide/photo/B/B001230.jpg",
      "channels": [
        {
          "type": "Facebook",
          "id": "senatortammybaldwin"
        },
        {
          "type": "Twitter",
          "id": "SenatorBaldwin"
        },
        {
          "type": "YouTube",
          "id": "SenatorTammyBaldwin"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "709 Hart Senate Office Building, Washington DC 20510",
          "featureId": {
            "cellId": "9923602661160726555",
            "fprint": "13491012159388313795"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": false
        }
      ]
    },
    {
      "name": "Gwen Moore",
      "address": [
        {
          "line1": "2252 Rayburn House Office Building",
          "city": "Washington",
          "state": "DC",
          "zip": "20515"
        }
      ],
      "party": "Democratic Party",
      "phones": [
        "(202) 225-4572"
      ],
      "urls": [
        "https://gwenmoore.house.gov/",
        "https://en.wikipedia.org/wiki/Gwen_Moore"
      ],
      "photoUrl": "http://bioguide.congress.gov/bioguide/photo/M/M001160.jpg",
      "channels": [
        {
          "type": "Facebook",
          "id": "GwenSMoore"
        },
        {
          "type": "Twitter",
          "id": "RepGwenMoore"
        },
        {
          "type": "YouTube",
          "id": "RepGwenMoore"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "2252 Rayburn House Office Building, Washington, DC 20515-4904",
          "featureId": {
            "cellId": "9923602067032561107",
            "fprint": "3004281461341646448"
          },
          "featureType": "typeCompoundBuilding",
          "positionPrecisionMeters": 162.19669259570352,
          "addressUnderstood": false
        }
      ]
    },
    {
      "name": "Tony Evers",
      "party": "Democratic Party",
      "phones": [
        "(608) 266-1212"
      ],
      "urls": [
        "https://evers.wi.gov/Pages/Home.aspx",
        "https://en.wikipedia.org/wiki/Tony_Evers"
      ],
      "emails": [
        "eversinfo@wisconsin.gov"
      ],
      "channels": [
        {
          "type": "Facebook",
          "id": "GovernorTonyEvers"
        },
        {
          "type": "Twitter",
          "id": "GovEvers"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 7863, Madison, WI 53707",
          "featureId": {
            "cellId": "9801616924981363173",
            "fprint": "4490709328792526618"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Mandela Barnes",
      "party": "Democratic Party",
      "phones": [
        "(608) 266-3516"
      ],
      "urls": [
        "https://evers.wi.gov/ltgov/Pages/default.aspx",
        "https://en.wikipedia.org/wiki/Mandela_Barnes"
      ],
      "emails": [
        "ltgovernor@wisconsin.gov"
      ],
      "channels": [
        {
          "type": "Facebook",
          "id": "LGMandelaBarnes"
        },
        {
          "type": "Twitter",
          "id": "LGMandelaBarnes"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 7863, Madison, WI 53707",
          "featureId": {
            "cellId": "9801616924981363173",
            "fprint": "4490709328792526618"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Sarah Godlewski",
      "party": "Democratic Party",
      "phones": [
        "(608) 266-1714"
      ],
      "urls": [
        "https://statetreasurer.wi.gov/Pages/Home.aspx",
        "https://en.wikipedia.org/wiki/Sarah_Godlewski"
      ],
      "emails": [
        "treasurer@wi.gov"
      ],
      "channels": [
        {
          "type": "Facebook",
          "id": "SarahforWI"
        },
        {
          "type": "Twitter",
          "id": "WITreasurer"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 7871, Madison, WI 53707",
          "featureId": {
            "cellId": "9801616924981363173",
            "fprint": "4490709328792526618"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Josh Kaul",
      "party": "Democratic Party",
      "phones": [
        "(608) 266-1221"
      ],
      "urls": [
        "https://www.doj.state.wi.us/",
        "https://en.wikipedia.org/wiki/Josh_Kaul"
      ],
      "channels": [
        {
          "type": "Facebook",
          "id": "WisconsinAttorneyGeneral"
        },
        {
          "type": "Twitter",
          "id": "WisDOJ"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 7857, Madison, WI 53707-7857",
          "featureId": {
            "cellId": "9801616924981363173",
            "fprint": "4490709328792526618"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Doug La Follette",
      "party": "Democratic Party",
      "phones": [
        "(608) 266-8888"
      ],
      "urls": [
        "https://sos.wi.gov/",
        "https://en.wikipedia.org/wiki/Doug_La_Follette"
      ],
      "emails": [
        "statesec@wi.gov"
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 7848, Madison, WI 53707-7848",
          "featureId": {
            "cellId": "9801616924981363173",
            "fprint": "4490709328792526618"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Jill Underly",
      "party": "Nonpartisan",
      "phones": [
        "(608) 266-3390"
      ],
      "urls": [
        "https://dpi.wi.gov/"
      ],
      "emails": [
        "dpistatesuperintendent@dpi.wi.gov"
      ],
      "channels": [
        {
          "type": "Facebook",
          "id": "WisDPI"
        },
        {
          "type": "Twitter",
          "id": "WisconsinDPI"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 7841, Madison, WI 53703-3474",
          "featureId": {
            "cellId": "9801612981527736513",
            "fprint": "14058942989319742098"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 3313.4046352581918,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Ann Walsh Bradley",
      "party": "Nonpartisan",
      "phones": [
        "(608) 266-1886"
      ],
      "urls": [
        "https://www.wicourts.gov/courts/supreme/justices/bradley.htm",
        "https://en.wikipedia.org/wiki/Ann_Walsh_Bradley"
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 1688, Madison, WI 53701-1688",
          "featureId": {
            "cellId": "9801613162839264457",
            "fprint": "7204020777835636499"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Annette Kingsland Ziegler",
      "party": "Nonpartisan",
      "phones": [
        "(608) 266-1881"
      ],
      "urls": [
        "https://www.wicourts.gov/courts/supreme/justices/ziegler.htm",
        "https://en.wikipedia.org/wiki/Annette_Ziegler"
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 1688, Madison, WI 53701-1688",
          "featureId": {
            "cellId": "9801613162839264457",
            "fprint": "7204020777835636499"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Brian Hagedorn",
      "party": "Nonpartisan",
      "phones": [
        "(608) 266-1885"
      ],
      "urls": [
        "https://www.wicourts.gov/courts/supreme/justices/hagedorn.htm",
        "https://en.wikipedia.org/wiki/Brian_Hagedorn"
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 1688, Madison, WI 53701-1688",
          "featureId": {
            "cellId": "9801613162839264457",
            "fprint": "7204020777835636499"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Jill K. Karofsky",
      "party": "Nonpartisan",
      "phones": [
        "(608) 266-1882"
      ],
      "urls": [
        "https://www.wicourts.gov/courts/supreme/justices/karofsky.htm",
        "https://en.wikipedia.org/wiki/Jill_Karofsky"
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 1688, Madison, WI 53701-1688",
          "featureId": {
            "cellId": "9801613162839264457",
            "fprint": "7204020777835636499"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Patience D. Roggensack",
      "party": "Nonpartisan",
      "phones": [
        "(608) 266-1888"
      ],
      "urls": [
        "https://www.wicourts.gov/courts/supreme/justices/roggensack.htm",
        "https://en.wikipedia.org/wiki/Patience_D._Roggensack"
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 1688, Madison, WI 53701-1688",
          "featureId": {
            "cellId": "9801613162839264457",
            "fprint": "7204020777835636499"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Rebecca Frank Dallet",
      "party": "Nonpartisan",
      "phones": [
        "(608) 266-1884"
      ],
      "urls": [
        "https://www.wicourts.gov/courts/supreme/justices/dallet.htm",
        "https://en.wikipedia.org/wiki/Rebecca_Dallet"
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 1688, Madison, WI 53701-1688",
          "featureId": {
            "cellId": "9801613162839264457",
            "fprint": "7204020777835636499"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Rebecca Grassl Bradley",
      "party": "Nonpartisan",
      "phones": [
        "(608) 266-1883"
      ],
      "urls": [
        "https://www.wicourts.gov/courts/supreme/justices/rbradley.htm",
        "https://en.wikipedia.org/wiki/Rebecca_Bradley_%28judge%29"
      ],
      "geocodingSummaries": [
        {
          "queryString": "P.O. Box 1688, Madison, WI 53701-1688",
          "featureId": {
            "cellId": "9801613162839264457",
            "fprint": "7204020777835636499"
          },
          "featureType": "typePostalCode",
          "positionPrecisionMeters": 500,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "David Crowley",
      "address": [
        {
          "line1": "901 North 9th Street",
          "city": "Milwaukee",
          "state": "WI",
          "zip": "53233"
        }
      ],
      "party": "Democratic Party",
      "phones": [
        "(414) 278-4212"
      ],
      "urls": [
        "https://county.milwaukee.gov/EN/County-Executive"
      ],
      "channels": [
        {
          "type": "Facebook",
          "id": "MilwaukeeCountyExecChrisAbele"
        },
        {
          "type": "Twitter",
          "id": "ChrisAbeleMKE"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "901 N. 9th Street, RM 306, Milwaukee, WI 53233",
          "featureId": {
            "cellId": "9801268167940321557",
            "fprint": "15932960262690670119"
          },
          "featureType": "typeCompoundSection",
          "positionPrecisionMeters": 0,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Israel Ramon",
      "party": "Democratic Party"
    },
    {
      "name": "Earnell R. Lucas",
      "address": [
        {
          "line1": "821 West State Street",
          "city": "Milwaukee",
          "state": "WI",
          "zip": "53233"
        }
      ],
      "party": "Democratic Party",
      "phones": [
        "(414) 278-4766"
      ],
      "urls": [
        "https://county.milwaukee.gov/EN/Sheriff"
      ],
      "emails": [
        "mkesheriff@milwaukeecountywi.gov"
      ],
      "channels": [
        {
          "type": "Facebook",
          "id": "MilwaukeeCountySheriff"
        },
        {
          "type": "Twitter",
          "id": "MCSOSheriff"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "821 W. State St., Room 107, Milwaukee, WI 53233",
          "featureId": {
            "cellId": "9801268163159047795",
            "fprint": "10347974844110276898"
          },
          "featureType": "typeCompoundSection",
          "positionPrecisionMeters": 61.555762857379484,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "George L. Christenson",
      "address": [
        {
          "line1": "901 North 9th Street",
          "city": "Milwaukee",
          "state": "WI",
          "zip": "53233"
        }
      ],
      "party": "Democratic Party",
      "phones": [
        "(414) 278-4067"
      ],
      "urls": [
        "https://county.milwaukee.gov/EN/County-Clerk"
      ],
      "emails": [
        "countyclerk@milwaukeecountywi.gov"
      ],
      "channels": [
        {
          "type": "Facebook",
          "id": "milwaukeecountyclerk"
        },
        {
          "type": "Twitter",
          "id": "MkeCountyClerk"
        }
      ],
      "geocodingSummaries": [
        {
          "queryString": "901 N. 9th Street, RM 105, Milwaukee, WI 53233",
          "featureId": {
            "cellId": "9801268167940321557",
            "fprint": "8638238200251821373"
          },
          "featureType": "typeCompoundSection",
          "positionPrecisionMeters": 0,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "David Cullen",
      "address": [
        {
          "line1": "901 North 9th Street",
          "city": "Milwaukee",
          "state": "WI",
          "zip": "53233"
        }
      ],
      "party": "Democratic Party",
      "phones": [
        "(414) 278-4033"
      ],
      "urls": [
        "https://county.milwaukee.gov/EN/Treasurer"
      ],
      "emails": [
        "david.cullen@milwaukeecountywi.gov"
      ],
      "geocodingSummaries": [
        {
          "queryString": "901 N. 9th Street, RM 102, Milwaukee, WI 53233",
          "featureId": {
            "cellId": "9801268167940321485",
            "fprint": "1654492850505789413"
          },
          "featureType": "typeCompoundSection",
          "positionPrecisionMeters": 0,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Scott B. Manske",
      "address": [
        {
          "line1": "901 North 9th Street",
          "city": "Milwaukee",
          "state": "WI",
          "zip": "53233"
        }
      ],
      "party": "Nonpartisan",
      "phones": [
        "(414) 278-3001"
      ],
      "urls": [
        "https://county.milwaukee.gov/EN/Comptroller"
      ],
      "geocodingSummaries": [
        {
          "queryString": "901 N. 9th Street, RM 301, Milwaukee, WI 53233",
          "featureId": {
            "cellId": "9801268167940321557",
            "fprint": "2604857980124348812"
          },
          "featureType": "typeCompoundSection",
          "positionPrecisionMeters": 0,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "George L. Christenson",
      "address": [
        {
          "line1": "901 North 9th Street",
          "city": "Milwaukee",
          "state": "WI",
          "zip": "53233"
        }
      ],
      "party": "Democratic Party",
      "phones": [
        "(414) 278-4190"
      ],
      "urls": [
        "https://county.milwaukee.gov/EN/Courts/Clerk-of-Courts"
      ],
      "emails": [
        "ctimail@wicourts.gov"
      ],
      "geocodingSummaries": [
        {
          "queryString": "901 N. 9th Street, RM 104, Milwaukee, WI 53233",
          "featureId": {
            "cellId": "9801268167929807693",
            "fprint": "15957523012418493430"
          },
          "featureType": "typeCompoundSection",
          "positionPrecisionMeters": 90.14716666156032,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "John T. Chisholm",
      "address": [
        {
          "line1": "821 West State Street",
          "city": "Milwaukee",
          "state": "WI",
          "zip": "53233"
        }
      ],
      "party": "Democratic Party",
      "phones": [
        "(414) 278-4646"
      ],
      "urls": [
        "https://county.milwaukee.gov/EN/District-Attorney"
      ],
      "emails": [
        "milwaukee.da@da.wi.gov"
      ],
      "geocodingSummaries": [
        {
          "queryString": "821 W. State St., Room 405, Milwaukee, WI 53233",
          "featureId": {
            "cellId": "9801268163254936483",
            "fprint": "1435794396843286421"
          },
          "featureType": "typeCompoundSection",
          "positionPrecisionMeters": 0,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Cavalier Johnson",
      "address": [
        {
          "line1": "200 East Wells Street",
          "city": "Milwaukee",
          "state": "WI",
          "zip": "53202"
        }
      ],
      "party": "Nonpartisan",
      "phones": [
        "(414) 286-2200"
      ],
      "urls": [
        "https://city.milwaukee.gov/mayor"
      ],
      "emails": [
        "mayor@milwaukee.gov"
      ],
      "geocodingSummaries": [
        {
          "queryString": "200 E. Wells Street City Hall Rm.201 Milwaukee, WI 53202",
          "featureId": {
            "cellId": "9801267695634126081",
            "fprint": "6701090671929923301"
          },
          "featureType": "typeCompoundBuilding",
          "positionPrecisionMeters": 83.225511004040342,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Tearman Spencer",
      "address": [
        {
          "line1": "200 East Wells Street",
          "city": "Milwaukee",
          "state": "WI",
          "zip": "53202"
        }
      ],
      "party": "Nonpartisan",
      "phones": [
        "(414) 286-2601"
      ],
      "urls": [
        "https://city.milwaukee.gov/CityAttorney"
      ],
      "geocodingSummaries": [
        {
          "queryString": "200 E. Wells Street, Room 800, Milwaukee, WI 53202",
          "featureId": {
            "cellId": "9801267695634126081",
            "fprint": "6075748533955388756"
          },
          "featureType": "typeCompoundSection",
          "positionPrecisionMeters": 83.225511004040342,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Aycha Sawa",
      "address": [
        {
          "line1": "200 East Wells Street",
          "city": "Milwaukee",
          "state": "WI",
          "zip": "53202"
        }
      ],
      "party": "Nonpartisan",
      "phones": [
        "(414) 286-3321"
      ],
      "urls": [
        "https://city.milwaukee.gov/Comptroller"
      ],
      "emails": [
        "asawa@milwaukee.gov"
      ],
      "geocodingSummaries": [
        {
          "queryString": "200 E. Wells Street, Room 404, Milwaukee, WI 53202",
          "featureId": {
            "cellId": "9801267695641315841",
            "fprint": "3334410313997349203"
          },
          "featureType": "typeCompoundSection",
          "positionPrecisionMeters": 0,
          "addressUnderstood": true
        }
      ]
    },
    {
      "name": "Spencer Coggs",
      "address": [
        {
          "line1": "200 East Wells Street",
          "city": "Milwaukee",
          "state": "WI",
          "zip": "53202"
        }
      ],
      "party": "Nonpartisan",
      "phones": [
        "(414) 286-2240"
      ],
      "urls": [
        "https://city.milwaukee.gov/treasurer"
      ],
      "emails": [
        "ctreas@milwaukee.gov"
      ],
      "geocodingSummaries": [
        {
          "queryString": "200 E. Wells Street, Room 103, Milwaukee, WI 53202",
          "featureId": {
            "cellId": "9801267695641315841",
            "fprint": "372862130668528290"
          },
          "featureType": "typeCompoundSection",
          "positionPrecisionMeters": 0,
          "addressUnderstood": true
        }
      ]
    }
  ]
}


`