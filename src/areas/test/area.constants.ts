import ROLES from "../../common/testConstants"

export default {
    testGeostore: {
        "geojson": {
            "crs": {},
            "type": "FeatureCollection",
            "features": [
                {
                    "geometry": {
                        "coordinates": [
                            [
                                [
                                    -2.013240043,
                                    50.73880781
                                ],
                                [
                                    -2.013847362,
                                    50.73468156
                                ],
                                [
                                    -2.01433955,
                                    50.73255114
                                ],
                                [
                                    -2.014712664,
                                    50.731382138
                                ],
                                [
                                    -2.011802376,
                                    50.730945231
                                ],
                                [
                                    -2.010944214,
                                    50.733295036
                                ],
                                [
                                    -2.007940648,
                                    50.735278699
                                ],
                                [
                                    -2.006969881,
                                    50.737753402
                                ],
                                [
                                    -2.013240043,
                                    50.73880781
                                ]
                            ]
                        ],
                        "type": "Polygon"
                    },
                    "type": "Feature"
                }
            ]
        },
        "hash": "c826fac0aa7686055695a85abd2625e0",
        "provider": {},
        "areaHa": 26.762628735804704,
        "bbox": [
            -2.014712664,
            50.730945231,
            -2.006969881,
            50.73880781
        ],
        "lock": true,
        "info": {
            "use": {}
        },
        "id": "c826fac0aa7686055695a85abd2625e0"
      },
    testArea: {
        "type": "area",
        "id": "62b07c69378080001b0d4e3f",
        "attributes": {
            "name": "Upton country Park",
            "application": "fw",
            "geostore": "c826fac0aa7686055695a85abd2625e0",
            "userId": ROLES.USER.id,
            "createdAt": "2022-06-20T13:55:53.424Z",
            "updatedAt": "2022-08-09T20:45:52.367Z",
            "image": "https://s3.amazonaws.com/forest-watcher-files/areas-staging/2b7692cc-483c-4b40-aeef-f4af852f83bb.upload_f0a4ab1b6c8a79dd760270551bcf7a6e",
            "datasets": [],
            "use": {},
            "env": "production",
            "iso": {},
            "admin": {},
            "templateId": "62f2c780b7e3b00acced08f1",
            "tags": [],
            "status": "pending",
            "public": false,
            "fireAlerts": false,
            "deforestationAlerts": false,
            "webhookUrl": "",
            "monthlySummary": false,
            "subscriptionId": "",
            "email": "",
            "language": "en",
            "confirmed": false
        }
      },
      testTeamArea: {
        "type": "area",
        "id": "62b07c69378080001b0d4e40",
        "attributes": {
            "name": "Upton country Park",
            "application": "fw",
            "geostore": "c826fac0aa7686055695a85abd2625e0",
            "userId": ROLES.ADMIN.id,
            "createdAt": "2022-06-20T13:55:53.424Z",
            "updatedAt": "2022-08-09T20:45:52.367Z",
            "image": "https://s3.amazonaws.com/forest-watcher-files/areas-staging/2b7692cc-483c-4b40-aeef-f4af852f83bb.upload_f0a4ab1b6c8a79dd760270551bcf7a6e",
            "datasets": [],
            "use": {},
            "env": "production",
            "iso": {},
            "admin": {},
            "templateId": "62f2c780b7e3b00acced08f1",
            "tags": [],
            "status": "pending",
            "public": false,
            "fireAlerts": false,
            "deforestationAlerts": false,
            "webhookUrl": "",
            "monthlySummary": false,
            "subscriptionId": "",
            "email": "",
            "language": "en",
            "confirmed": false
        }
      },
}