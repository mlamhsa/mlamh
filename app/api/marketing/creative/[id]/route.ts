import { createElement } from "react";
import { ImageResponse } from "next/og";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const ARABIC_HOOK_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA4QAAADmCAYAAACNmkv3AAA+gUlEQVR42u3debwk0/3/8deYzUyNqbFWIfadtq8Txh57JNZYgiYIgghB7EIkhBCCWBLpWL/WCCFjJ7ZYYm1j7NugGsOUmZoZs93fH+fcn6tVVW/Vy733/Xw87oOp6q7qPrX0+dQ553NARERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERER6iQEqApH6RGGwBXAasA4wDbgL+JXj+h/FvHYEcAawO7Ag8DpwruP6V6skRUREREQBoUjvCgb3AK4D5ipbNQFYv2dQGIXBcOARGziWO8Nx/dNUoh13fCcBbtwqx/VH9MPyeBjYJGH1PI7rT6lxeyEwMmbVu47rL6UzsOnH83TMw6w433dc/18qJRGR/mMuFYFIzZUpB/hzwvXzHeDssmW/SAgGAU6OwmBFlWrHmZqwfJjK41ucOrY3PWH5UJ16vfJ4irTit3fPKAyei8JgehQGH0dhcGEUBvOoZEQUEIq0w2hgVMr6bSv8u/wa3FpF2nGmJR2vKAzmVgDxDcPr2N5XCgg78vyu93iKNDsYPBG4HljT3id84EjgEfuQVkQUEIq01KAa1w9qcHvS+wOgvhxA1FMZU0Co81uk2mBwacwY/DhrAseolEQUEIq02pNA2pip+yr8u9z9KtJeFQD1xwqzWggV4Iu0y1bAwJT126qIRBQQirSU4/ohcBTQFbO6BBxXtuxcoJiwufMd139RpdrnAyCVR3UB4aAoDPS7pPNb5Bv3hQbXi4gCQpGmBIV/BXbAtBZOByYBNwDrOa7/btlrvwTGABcDHwMzgXHATx3XV1eXzqQWwurLI8uk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[... ELLIPSIZATION ...]RIRLcX7uuP5FHXKdboFJZ79AHzyOrwJ795xQ3V6njzTp+34F7Oe4/o32IdEtpGdHzsKzmG7NE20L3b00Pk633T6297dWTnfhAx8S30X335hxju1OVPgWsL/j+o/qFi1SG2UZFWkTx/UjTEKUM0ge21Wr54HNegaDdl9jMROp70d9GSHL/RHYv8bvO85x/dGYbKvPNrFo/wmsklUwaD/7Z5juZn+j+taBrL2CmfYkbz/H2236HGOB1RoJBnsEB0mGdtB1+gAmkUWhjcc+a18AvwLW6BkMdl+nmK7dWc8tOh7Y3HH9G+1+ujBz/DUredAc4M/AmO7kL7bFaAfg7l563GYC5wIrtDIYtH6SUmc8xv62zGxTubwJHAGsrGBQpD5qIRTpAFEYLIWZiy6PGV9Sq8nAxZjuQ19V2NcAzNPcPCaL3cga9vMscJzj+g9l8J3XxYy5+iG1jSWKMwmTAfHPdl6/Zh6rVYFf2M/drEmYu2yF/FngP8D9juu/EfNZFsR04VoTM6VJDjMmKevuhdMxY3IuzKrCVSFBxSmO6/+mA6/TVYHjgD3onWPw3wIuBy53XP/LCt/VxYwnPKLBAP1/mKk8/ua4/oyEfe0AHInpQj8wg3P1enuuvpRyDzzCPmAZ1UsC+KuAix3Xf7cN5/1gG3QtHrP6M2AhO956Jcw8hK1ogX0D83DqNkwW6b7ysEZEAaGIAsNgLlu53xzTvXM5TKKHEXydYXMGZhzLO5jU7E/aH8Qv69jfEGBdG1SsjklusLgNdAbYishrmKkX/uG4/jNN+t5LYsborWY/w3cwSRdGYsZPdfF1psxJwHv2+78KPAq8UGta84wqSesBa9vPvTgmg96CmLFCQzEJKrowmQmnYlrFIkyWve6/SZjxeB9j0tm/CbxW63QRZZ9rGRtkL2rLsvu/nj2PhtvPONx+xgF8ndG1ex7Nd+1neRx4stKDhjo+5zaYrmZxznJc/+QOvk4XtEHhHvbaGdjBt5VXbcX5Fnscu2r8ri4m4+Um9oHD4pgMxI49t2fac3iiDQ7et4Hny8Bj1UxH02Nf8wIbYZKXrNDjnHXtPXCoDcS7s5tOxbSUf4hJ4vMY8J/yKTEqfLdDqDy1SjvMsfe264FrHdef2sbz/eeYXiFxLndc/5Cy14/GdAUebe9F8/LNcbFpuu/1U+y9cor9vXvdBoFvAM+X94IREQWEIiIi7aoszwtsgRkLvI59oDOsDR+lywZjr2Dmw3zGBoAf6yhVdRxXxnTh3wRYi9qnmmnUTBvUPg08jOkV8FkHlMsCmO6+8ye8ZFPH9R/RGSSigFBERET4/638S2Iy6i6HaeVaGNPiPR+m1XskpnV2MKbFq3te0e5MozMxrclf8XVryRRM6+1E+/cJpuXkI0xr7jtZt+L28+M4EjP5+ZKY6SEWxSTamd8ex+5eG92t7QPtX88WzNn2WE7FtHZNtsfuU77uEfAOphfG60ldattYBgOAfwHbJbzkBcf119TZIqKAUERERET6XlB8InBWykt+5Lj+TSopkd5PWUZFREREpGcweECFYPAJ4GaVlEjfoBZCEREREekOBvfCzBGalCxpFrCW4/ovq7RE+ga1EIqIiIgIURgcC1xLeubcoxUMivQtaiEUERER6d+B4HDgIswE9GkKjuvvrxIT6VsGqQhERERE+m0wuBZmvsMVKrz0acy8jSLSx6iFUERERKT/BYKjgFOAIzBToKR5F9jQcf2PVHIiCghFREREpPcGgkOBnwKnYeZUrOQVYCsFgyIKCEVERESk9waC8wOHAYcDC1X5tqeA7RzX/1wlKKKAUERERER6VxA4ABgD7AvsBQyr4e1jgd0c15+ikhRRQCgiIiIivScQHIjpEroPsGSNb58DnAmc4bj+HJWmiAJCEREREel9QeHTwLo1vu0dIO+4/n9UgiL9h6adEBER6WeKBW85TGKRLYClgSFACXgWuDSXLz2oUur1/lZDQDgLuBg4RV1ERRQQioiISN8NBAcDvwOOAgaWrV7C/j0DKCDs/a4H/kDlcYP3Ar90XP9lFZlI/zSXikBERKRfBINzAbcCx8QEgz29rtLq/RzXD4F/JKzuAu4GNnZcf2sFgyIKCEVERKTv+ynw/Spe94aKqs+4quzfU4HLgJUc19/ecf1HVUQioi6jIiIi/cPhZf9+EjgVeAGYDiwHbAm8paLqMx4ExmNafW8C7nBcf7KKRUR6UpZRERGRPq5Y8OYHPuux6HNgmVy+NEml07dFYTCXpo8QkTTqMioiItL3+WX/fl7BYP+gYFBEFBCKiIjIl2X/Hq4iERERBYQiIiL9wwSg59ixdYoFz1exiIiIAkIREZE+LpcvdWEmKu82GLiiWPASp58oFjzlGRARUUAoIiIifcTvMclkun0fuL9Y8BbpEQQOLha8rYoF72rgORWZiEjfp6d/IiIi/USx4G0D3Mk3p52aClyLGVe4AzCqx7pVcvnSOJWciEjfpRZCERGRfiKXL40FdgZm9Vg8HDgY+HFZMAiwo0pNRKRv08T0IiIifVyx4LmYiek3Bjas4fd/WZWeiIgCQhEREendZgKnV/m7/yJwK3BjLl96XUUnItK3aQyhiIhIP1AseP8D1opZNQ14CLgbuCuXL72r0hIR6T/UQigiItI/PNkjIBwHPACMBR7K5UvTVDwiIgoIRUQ6TrHgPQusHbNqsVy+NEElJFK1q4HHbQAYqDhEREQBoYj0BlMTljsqGpHq5fKlp4GnVRIiItKTpp0QkU6X1JVtuIpGRERERAGhiPRtUxUQioiIiCggFJH+SS2EIiIiIk2iMYQi0unUQijSBCnTUAzN5UszVEIiIv2DWghFpNOphVCkOb5KWD5URSMi0n+ohVBEOp1aCEVaHxBOVvHEKxa8VYHzgY2AEPg7cEp5q2qx4G0CnA2sCXwCXAT8IZcvdakURUQBoYhI9dRCKNL6gFDig8GlgEcB1y6aGzgOWAzYq8frRgP3AYPtosWAc4GRwKkqSRHpJOoyKiKdTi2EIs0xQwFhzY7tEQz2tKdtOez26x7BYE/HFwueq2IUEQWEIiLVUwuhSHMktRAOUdEkWrHKdSumlO3SKkYRUUAoIlK9pBZCR0Uj0pSAUC2Eyd5OWfdWwv/3NBt4T8UoIgoIRUSqpxZCEQWEneI8IIpZfkcuX3qux7/PsMFfuQtz+dLnKkYRUUAoIlI9jSEUUUDYEXL50nhgE+AhYDrwKXAB8KOy1z0EbAs8gxmr+SFwEmYMoohIR1GWURHpdH2yhbBY8LxcvlTS4ZU2UlKZ+oLC/wGbV/G6+zCZRkVEFBCKiDSgz7UQ2iyDjxcL3ivA/upCBsWCtyympWVz+xDg/4DjcvnSVF0CTaOkMiIiooBQRDpeU1sIiwVvCPAbYB9gFPAYcFQuX3qlid/pKmAZ+/dCseDtlcuXHuvHweBCmLnd/B7H9mfA8sBWugRaHhAObdFxH5TLl2bpMIiItJfGEIpIp2t2C+G1mHE9PmaS6S2BR4sFb8kmVYJ/AezcY9FiwMPFgverYsEb0E+P8eE9gsGevlcseJvpEuh7AWGx4H0PeK1Y8NbXYRARUUAoIpKmaS2ExYK3GrBbzKp5aULyh2LBGw2cE7NqIPA74M5iwZuvHx7jFetcJ41p+RjCYsEbVSx4VwH3Yubju7JY8AbrUIiIKCAUEUnSzBbCVgciLjA5Zf32wPPFgrdOPzvG1c7tJtlq6RjCYsHbCRgH7N9j8arAL3UoREQUEIqIJGnmGMKWBiK5fGkssAZmnGKSxTFdVvfvR8f4YmBizPLHgPt1CbQ8IMy8hdCO1T0XWDhm9SnN6qItIiIKCEWk92taC2EuX3oWuCtm1RTMBNSZy+VLHwCbAn9PedncwFXFgvfn/tCdLpcvTQDGAGPtA4AvgCuA7XP50hxdAr0/IMzlSzOAA4GumNXDgAv7UsEWC97IYsFbSaeYiPQGyjIqIp0eLMwqFrxZMfcrJ6Nd7A78FtgT06XzSeDoXL70epMqit8DTgU2rOLlhwArFgverrl8aWIfP86vYibylj4YENpj/HCx4F0GHBqzesdiwds+ly/d1YuDwIGYpFT7AjsBRWA9nWYi0ukGqAhEpBdUtEJgZMyqIbl8aWYv+Q7DgL/awLNWbwM72KBJJKtzchfglphVZ+TypdOatM95bKC0eMzqN4BVess13eM7LQz8AtgbWKRs9cq6bkWk06nLqIj0Bk2di7AFFcYRwAN1BoNgsjE+oSkYJGMtn5g+ly9NxkwzEmc54LBeWI6DMYlxFolZt4dOMxFRQCgi0rhmz0XYbFcBoxvcxihgbLHg7a3ToSOD/nmKBW/vYsG7qVjwXisWvCnFghcVC94rxYJ3SbHgrdWLAsKmzkOYy5fuBO5MWH1qseDN25uOfS5feh94JGH1jro6REQBoYhI43ptC2Gx4P2Y+LkOwSRPuR44G7gS+KDC5oYA1xQL3lE6JTrqGB8GvAtca4/18pgxrsOBlTGtXv8rFrxrbJfJfh0QWkcS/6BnPuC4XngaXJ2wfI1iwVtcV4mIKCAUEWlMr2whLBa8uTEJa+L8DVg8ly/tncuXTsjlSwdjuob+vsJmBwAXFAvemTot2n98iwXvZuASG8hU8mMbGOY65Cu0fGL6brl86d2Ua+PIYsHzetnpcAvJD6621tUiIgoIRUQa01tbCHcBFotZfk0uXzqogly9NKaskz8rlS8cD11Sx7ZOLBe88nRptCwaHAP8Edq3xrcsBDxQL3jId8DVaPoawzPnEt4oPB07oTeeDHRt5d8LqzXXFiIgCQhGRxvTWMYT7xCwrAT+r8L5fAtOr2P4xxYJ3tk6Ptrgc2KrO9y4E3FMsePN3aEDYii6j5PKlacDJCasPLha8BXvZOXGbAkIR6Y00D6GI9AYtaSEsFrx5gBVjVr1kA7B6vJkQyO5ZxXt/iGntK/e8rTx/hclAmjQu7aw2BRidGBCuk1FF/AS+3TrYhWmxrTbomY7JLPqtYAFYtQ1BWBcwsxMCQuvmhOU7FQvesA68xpO8krB8Pt3KRUQBoYhIfZJaCLN64r5uwv2w2EBlexbwcMyqVYoFb9eUiusg4LSE1Xf12P4ETLr+OKsDW/azc+QFzByP5QYCmzQYTCxN/BQgt+TypZdq3NyNNpAst1ybym1GpwSEuXzpFeDTmFUjgO067RpP8XbCcle3chFRQCgiUp+ktP1ZTey9YY0Vu2pdl7D8kmLB8xPWnYzJhljuc76dwfAabKthjB+16uAUC97IYsF7vVjwzrLBUzuCiS7g3oTVjU4MfpINLMv9po7PWQLeilnltenaius2OqSN1/qbTTqfm3WNx5mUsHy2buUiooBQRKQ+XyYsXzSj7ScFDJ83uN2bgXdili8EXGcnr+8ZWB0AnJqwrfNz+VIUEwT9LuH1rcxcuQemhetE4M1iwXuwWPD2svO+tVJSt9G6W5eKBW8F4iePH1tH62C392OWzdNBAeHQNl7rgxKW71AseG4HXuO11K0m61YuIgoIRUTq80XC8uUb3XCx4M2XEjwNamTbuXxpBnBMSgX1xmLBG1IseHMVC96pwF+Jz2L5BsnTTdxF/DiwZW1ymlbYv8f/DwA2w7SOrtji8+ThpPOkWPDWrXOb5yWcB+dn/Nmj/h4Q2u7SyyasHkadyWWaeY0nWCBmWRfwsW7lIqKAUESkPh8kVbyKBW+ZBre9b0qlsOFU8bl86R8kd2XcBdMN9GHMlAZJFfa9bEKSuO1PJT5z5UBaMGapWPCWx0y8Xm5cLl96oZUnSS5f+pD41jcwrZe1frddic/2+nouX7qvgY8aF/RMbNO11TFjCIHtgXlT1h9bLHhOp13jMdaMWfa2fUAkIqKAUESkDu8Q3woGsF8Dwcz8pGeJ3LNY8LKY2uLHKYHKVsCYhHVdwIG5fOnZCttPGvM1pwXH5vsJy69v07nyYsLyHxYL3o9qODeWBi5PWL18seDdWCx4y9Zxzm1A/FyUr7epvOJaCAdV27pcLHg7Z3GNFAveQsCFFV7mY6bu6MRrvHt/w4DdYlY9odu4iCggFBGpUy5fmonJIhnn+GLBq3mMmE1DfxuwSIUK6G3Fgrdwg5//U2BHYHoNb5sNHJzLl66t8D3WApaIWTWZ5LGXWdo2YfkdbTpdxqesu7pY8I6o4txYCtOqmzZNwO7A+GLBu84GedWccyOBy2JWTQPGdVBAmPaQoef3WR+4BXinWPBOLRa8usb0Fgved4HHE87jcocWC97JnXaN2/0NBa4kfsqYf+pOLiKdaoCKQER6g2LBO4vkbn9dwL+AW4HngHdy+dKUhAr5CphWuV9QfZbSacDtwH3AS5guml/k8qU5CZ91XkzimKUwXdLWBDYFFqvhKz9ug4fXMFkpQzt5d/c+PEwXu7NspbbcA7l8acsmHxMHk5SjPHj4KJcvLdqm8+RQ4NIKL/sf8BfgMUz3zxk2wc9SmBbnI6i9u+0b9hx8EngamNB9vOyx2hqTQTZueom7cvnSDm0qr8eIz8A5KpcvhSnvG2C/a8/J3ufY8/ZR+98Xgc9z+dK0svcuaMthA/ugpJ5pQe4FLgIez+VLk1p9jdt9jcCMF1wK+C5wABCXZfdDYGl1GRURBYQiIo1VXFehtjnDvuLrCe3nsUHj4Aw/0hxgCqYr6xxglP3/ocRPUZCFyH6n4UClsVSH5vKly5p8TMYA/4lZdW0uX9qnTefJLphWq2p1YVpu5874N3EOJhnSMHu80myby5fGtqm8HiA+A6eXy5c+SXnffkChhmtxsr02htdwfXxEeutet6l2211kmySm/Bp37b4G2eNa7ff4SS5fukp3cRHpVOoyKiK9gp20+tYa3jIUk6BiXluBqyYYnAmcWcP9cySmBWJBu/1aKrv1cOy+KgWDH2HmKGy21ROWP9/GU6XW5CwDbOW+UjB4P6ZVsauG82P+KoLBB9sVDFozUq6fpGBwBMnTnSRtawHMg5lqr48vMGNr/13Fa7uvu0FNvsaHYB78jKjhe9ymYFBEFBCKiGTncOC9Jm27C9OqdipwY4u+z2TgbpIT5tT7PQ4pn7OwSVZNWP5SG8+R6U3Y5rvAHrl86SBM98ZXMtpuiW9O2dEO9YwhXN0GSs3yCbBFLl9625bP+730Gv8nJqGUiIgCQhGRLOTypQAzx13WLVBTgR/n8qW/2n/vjxlP1CzPA4cAi+Type0x46muILm1plrdiWjubNEh+U7C8g/beJokleGsOrf3PrB5Ll+aaM/BR21AdCAwoYHP+RGwdS5fer/Nl1VSQDg05Tp8HMhhMslmncl2LLBGLl963u6rBGyBGaPZW67xzzEPr3YqHz8pIqKAUESk8aDwHUwii59lUEmcDdwMrJbLl67vsY9pwM6YBCNvZPCxpwH3AEcDq+TypbVy+dLl3YlvcvnSe7l86afAkvY1z9SxjxeBMbl86S8tPBxJc8Z90cZTZJ6E5f8CdqW2FubbgXXsOdfzHJxtA4ulgX0wUwpU25W0ywZSa+fypRc74JKqOSC0ZfBuLl/aGzOn4tmYxEf16gIeBLbP5Uvb5vKlj8v29SawDnAeX48L7rRrvMtet0cCS+bypUty+VIXIiK9gJLKiEivVix4qwEbYzJ5LoNJ+b4AJknIUHuf68JMwRBgWnXGYzJB3mdbICrtYx1MV8G1MBkFF7bB0FC+Hps4A9MFMLT7eBUzlcA44MWkieVT9rkkJnPhuna/3fschWntCm0l/Bngzly+9EAbyv5lTEtROb+acm3SZ9oLuC5m1Zm5fOlUm030B8B2wGhMhtZ5beAwEZMd8wngnly+VKxhvz4mOct6mK60ywIeZlzb5/Z8eAC4LpcvvdVB18+VmNbOcqNz+dJ/a9zWMsDa9m9NW7YuX4+7m2Efjky0gfmbmEylD1XbUloseKMw8/xtBayBSTozzF7jUzCt0824xrvvI5Pt8fzUfofXMJmNH8vlS5/pjiwiCghFRKQ/BeP/5ZvTDnRbKZcvjW/TZzoX+GXMqt1z+dLNOmoiIiLfpC6jIiJSr6SuoSu28TNtn7D8aR0uERERBYQiIpKdDxKWb9yOD1MseOsCK8Wsei6XL72nwyUiIqKAUEREsvNUwvK9iwVvSBs+z0kJy2/ToRIREVFAKCIi2XosYflCmGyLLVMseDthksWU68JkmRQREZEYSiojIiKNBGJPYTJrlpuOmQbj2RZ8hrUxGTzdmNV35fKlHXSkRERE4qmFUEREGvHnhOVzA2NtOv9mBoPbAPclBINzgNN1iERERJKphVBERBoJyAZiMniulfCSr4DjgYtz+dLsDPc7rw32jkj5Lbs0ly/9TEdJ7JjW3wD7YOZFfAw4KpcvvaLSEREFhCIiIo1VttcC/ouZwDvJOOB84IZcvjS1gX0tAxwAHIqZODzxpcB6uXxpmo6QFAveTZgJ7Xv6Algrly+9qxISEQWEIiIijVW4fwxcXcXvyjTgIeBh4DngDeCjXL40q2x7cwEesCSwNLABMAZYrYp9fARslMuX3tGRkWLBWw14MWG1WpFFpN8bpCIQEZFG5fKla4sFbz7gjxUCtmHAdvav25xiwYswiWgGAcOBoXV+lAnA1goGpYcV61wnItIvKKmMiIhkFRReBOwMRHX8Fs0DLIjpBlpvMPgUsH4uXxqnoyE9vJ2y7i0Vj4goIBQREckuKLwd063z3hbuNgJOADbM5Usf6ShI2Tn5LHBXzKopwHkqIRHp7zSGUEREmqJY8H4AHAd8t0m7+BL4C3BOLl/6RCUuKeficOC3wJ6YKUqeBI7O5UvPq3RERAGhiIhIcyvj69qK+C7A4g1ubiomKc2twI2NZCwVERERBYQiItLa4HA5TIvh2sCywFLAAphEMnMDszDJZaYCn2Ayhr4PvAy8ADyby5emqyRFRERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERESkU/0/GwGEnzgsks4AAAAASUVORK5CYII=";

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function hasArabic(value: string) {
  return /[\u0600-\u06FF]/.test(value);
}

function dimensions(aspectRatio: string | null, contentType: string | null) {
  const ratio = (aspectRatio ?? "").toLowerCase();
  const type = (contentType ?? "").toLowerCase();
  if (ratio === "9:16" || type === "story" || type === "reel" || type === "video") {
    return { width: 1080, height: 1920 };
  }
  if (ratio === "1.91:1" || ratio === "1200:630") return { width: 1200, height: 630 };
  return { width: 1080, height: 1080 };
}

function brandedArabicFallback(vertical: boolean) {
  const logoUrl = "https://mlamh.net/logo.ar.png";
  return createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#171717",
        color: "#F5F1E8",
        padding: vertical ? "110px 84px" : "74px 76px",
        fontFamily: "sans-serif",
      },
    },
    createElement(
      "div",
      { style: { width: "100%", display: "flex", justifyContent: "flex-end" } },
      createElement("div", { style: { width: vertical ? 150 : 120, height: 7, borderRadius: 12, backgroundColor: "#D4A017" } }),
    ),
    createElement(
      "div",
      { style: { width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } },
      createElement("img", {
        src: logoUrl,
        width: vertical ? 560 : 500,
        height: vertical ? 300 : 270,
        style: { objectFit: "contain", maxWidth: "80%" },
      }),
      createElement("img", {
        src: ARABIC_HOOK_IMAGE,
        width: vertical ? 820 : 760,
        height: vertical ? 210 : 194,
        style: { objectFit: "contain", maxWidth: "92%", marginTop: vertical ? 42 : 28 },
      }),
    ),
    createElement(
      "div",
      { style: { width: "100%", display: "flex", flexDirection: "column", alignItems: "center" } },
      createElement("div", { style: { width: 74, height: 5, borderRadius: 12, backgroundColor: "#D4A017", marginBottom: 22 } }),
      createElement("div", { style: { fontSize: vertical ? 36 : 30, color: "#D4A017", fontWeight: 700, letterSpacing: 1 } }, "mlamh.net"),
    ),
  );
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const creativeId = Number(id);
  if (!Number.isInteger(creativeId) || creativeId <= 0) {
    return new Response("Invalid creative id", { status: 400 });
  }

  const db = createAdminClient();
  const { data: creative, error } = await db
    .from("marketing_creatives")
    .select("id,content_id,platform,aspect_ratio,status")
    .eq("id", creativeId)
    .maybeSingle();
  if (error || !creative?.content_id) return new Response("Creative not found", { status: 404 });

  const { data: content } = await db
    .from("marketing_content")
    .select("title,hook,cta,content_type,channel")
    .eq("id", creative.content_id)
    .maybeSingle();
  if (!content) return new Response("Creative content not found", { status: 404 });

  const title = text(content.hook) || text(content.title) || "MLAMH";
  const cta = text(content.cta) || "Discover opportunities on mlamh.net";
  const platform = text(creative.platform || content.channel).toUpperCase();
  const { width, height } = dimensions(creative.aspect_ratio, content.content_type);
  const vertical = height > width;
  const arabicContent = hasArabic(title) || hasArabic(cta);

  const root = arabicContent
    ? brandedArabicFallback(vertical)
    : createElement(
        "div",
        {
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#2E2E2E",
            color: "#F5F1E8",
            padding: vertical ? "88px 76px" : "68px 70px",
            fontFamily: "sans-serif",
          },
        },
        createElement(
          "div",
          { style: { display: "flex", flexDirection: "column" } },
          createElement(
            "div",
            { style: { display: "flex", alignItems: "center" } },
            createElement("div", { style: { width: 64, height: 7, borderRadius: 12, backgroundColor: "#D4A017", marginRight: 18 } }),
            createElement("div", { style: { fontSize: vertical ? 32 : 27, color: "#D4A017", fontWeight: 700 } }, "MLAMH"),
          ),
          createElement("div", { style: { marginTop: 14, fontSize: vertical ? 22 : 18, color: "#B7B2AA" } }, platform || "TALENT & OPPORTUNITIES"),
        ),
        createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", width: "100%" } },
          createElement("div", { style: { fontSize: vertical ? 76 : 62, lineHeight: 1.3, fontWeight: 700 } }, title),
          createElement("div", { style: { width: 170, height: 8, borderRadius: 12, backgroundColor: "#D4A017", marginTop: 34 } }),
        ),
        createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", borderTop: "1px solid #5B5140", paddingTop: 28 } },
          createElement("div", { style: { fontSize: vertical ? 28 : 23 } }, cta),
          createElement("div", { style: { marginTop: 14, fontSize: vertical ? 26 : 22, color: "#D4A017", fontWeight: 700 } }, "mlamh.net"),
        ),
      );

  try {
    return new ImageResponse(root, {
      width,
      height,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("[MarketingCreativeImage] render failed", error instanceof Error ? error.message : "unknown");
    return new Response("Creative image render failed", { status: 500 });
  }
}
