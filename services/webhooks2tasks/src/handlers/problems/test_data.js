module.exports = {
  "application/vnd.scanner.adapter.vuln.report.harbor+json; version=1.0": {
    "generated_at": "2020-03-20T21:45:33.187666462Z",
    "scanner": {
      "name": "Clair",
      "vendor": "CoreOS",
      "version": "2.x"
    },
    "severity": "Critical",
    "vulnerabilities": [
      {
        "id": "CVE-2017-11333",
        "package": "libvorbis",
        "version": "1.3.4-2",
        "fix_version": "1.3.4-2+deb8u3",
        "severity": "Low",
        "description": "The vorbis_analysis_wrote function in lib/block.c in Xiph.Org libvorbis 1.3.5 allows remote attackers to cause a denial of service (OOM) via a crafted wav file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11333"
        ]
      },
      {
        "id": "CVE-2018-10392",
        "package": "libvorbis",
        "version": "1.3.4-2",
        "fix_version": "1.3.4-2+deb8u2",
        "severity": "Medium",
        "description": "mapping0_forward in mapping0.c in Xiph.Org libvorbis 1.3.6 does not validate the number of channels, which allows remote attackers to cause a denial of service (heap-based buffer overflow or over-read) or possibly have unspecified other impact via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-10392"
        ]
      },
      {
        "id": "CVE-2018-10393",
        "package": "libvorbis",
        "version": "1.3.4-2",
        "fix_version": "1.3.4-2+deb8u2",
        "severity": "Medium",
        "description": "bark_noise_hybridmp in psy.c in Xiph.Org libvorbis 1.3.6 has a stack-based buffer over-read.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-10393"
        ]
      },
      {
        "id": "CVE-2017-14160",
        "package": "libvorbis",
        "version": "1.3.4-2",
        "fix_version": "1.3.4-2+deb8u2",
        "severity": "Medium",
        "description": "The bark_noise_hybridmp function in psy.c in Xiph.Org libvorbis 1.3.5 allows remote attackers to cause a denial of service (out-of-bounds access and application crash) or possibly have unspecified other impact via a crafted mp4 file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14160"
        ]
      },
      {
        "id": "CVE-2018-5146",
        "package": "libvorbis",
        "version": "1.3.4-2",
        "fix_version": "1.3.4-2+deb8u1",
        "severity": "Medium",
        "description": "An out of bounds memory write while processing Vorbis audio data was reported through the Pwn2Own contest. This vulnerability affects Firefox \u003c 59.0.1, Firefox ESR \u003c 52.7.2, and Thunderbird \u003c 52.7.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-5146"
        ]
      },
      {
        "id": "CVE-2017-14633",
        "package": "libvorbis",
        "version": "1.3.4-2",
        "fix_version": "1.3.4-2+deb8u3",
        "severity": "Medium",
        "description": "In Xiph.Org libvorbis 1.3.5, an out-of-bounds array read vulnerability exists in the function mapping0_forward() in mapping0.c, which may lead to DoS when operating on a crafted audio file with vorbis_analysis().",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14633"
        ]
      },
      {
        "id": "CVE-2017-17095",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u10",
        "severity": "Negligible",
        "description": "tools/pal2rgb.c in pal2rgb in LibTIFF 4.0.9 allows remote attackers to cause a denial of service (TIFFSetupStrips heap-based buffer overflow and application crash) or possibly have unspecified other impact via a crafted TIFF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-17095"
        ]
      },
      {
        "id": "CVE-2018-18557",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u7",
        "severity": "Medium",
        "description": "LibTIFF 4.0.9 (with JBIG enabled) decodes arbitrarily-sized JBIG into a buffer, ignoring the buffer size, which leads to a tif_jbig.c JBIGDecode out-of-bounds write.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-18557"
        ]
      },
      {
        "id": "CVE-2018-10963",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u6",
        "severity": "Medium",
        "description": "The TIFFWriteDirectorySec() function in tif_dirwrite.c in LibTIFF through 4.0.9 allows remote attackers to cause a denial of service (assertion failure and application crash) via a crafted file, a different vulnerability than CVE-2017-13726.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-10963"
        ]
      },
      {
        "id": "CVE-2017-9404",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u4",
        "severity": "Medium",
        "description": "In LibTIFF 4.0.7, a memory leak vulnerability was found in the function OJPEGReadHeaderInfoSecTablesQTable in tif_ojpeg.c, which allows attackers to cause a denial of service via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9404"
        ]
      },
      {
        "id": "CVE-2017-18013",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u5",
        "severity": "Medium",
        "description": "In LibTIFF 4.0.9, there is a Null-Pointer Dereference in the tif_print.c TIFFPrintDirectory function, as demonstrated by a tiffinfo crash.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-18013"
        ]
      },
      {
        "id": "CVE-2018-17000",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u8",
        "severity": "Medium",
        "description": "A NULL pointer dereference in the function _TIFFmemcmp at tif_unix.c (called from TIFFWriteDirectoryTagTransferfunction) in LibTIFF 4.0.9 allows an attacker to cause a denial-of-service through a crafted tiff file. This vulnerability can be triggered by the executable tiffcp.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-17000"
        ]
      },
      {
        "id": "CVE-2016-10269",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "LibTIFF 4.0.7 allows remote attackers to cause a denial of service (heap-based buffer over-read) or possibly have unspecified other impact via a crafted TIFF image, related to \"READ of size 512\" and libtiff/tif_unix.c:340:2.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10269"
        ]
      },
      {
        "id": "CVE-2019-14973",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u9",
        "severity": "Low",
        "description": "_TIFFCheckMalloc and _TIFFCheckRealloc in tif_aux.c in LibTIFF through 4.0.10 mishandle Integer Overflow checks because they rely on compiler behavior that is undefined by the applicable C standards. This can, for example, lead to an application crash.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-14973"
        ]
      },
      {
        "id": "CVE-2014-8130",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The _TIFFmalloc function in tif_unix.c in LibTIFF 4.0.3 does not reject a zero size, which allows remote attackers to cause a denial of service (divide-by-zero error and application crash) via a crafted TIFF image that is mishandled by the TIFFWriteScanline function in tif_write.c, as demonstrated by tiffdither.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2014-8130"
        ]
      },
      {
        "id": "CVE-2018-17101",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u7",
        "severity": "Medium",
        "description": "An issue was discovered in LibTIFF 4.0.9. There are two out-of-bounds writes in cpTags in tools/tiff2bw.c and tools/pal2rgb.c, which can cause a denial of service (application crash) or possibly have unspecified other impact via a crafted image file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-17101"
        ]
      },
      {
        "id": "CVE-2017-7602",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "LibTIFF 4.0.7 has a signed integer overflow, which might allow remote attackers to cause a denial of service (application crash) or possibly have unspecified other impact via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7602"
        ]
      },
      {
        "id": "CVE-2017-10688",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u4",
        "severity": "Medium",
        "description": "In LibTIFF 4.0.8, there is a assertion abort in the TIFFWriteDirectoryTagCheckedLong8Array function in tif_dirwrite.c. A crafted input will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-10688"
        ]
      },
      {
        "id": "CVE-2017-11335",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u5",
        "severity": "Medium",
        "description": "There is a heap based buffer overflow in tools/tiff2pdf.c of LibTIFF 4.0.8 via a PlanarConfig=Contig image, which causes a more than one hundred bytes out-of-bounds write (related to the ZIPDecode function in tif_zip.c). A crafted input may lead to a remote denial of service attack or an arbitrary code execution attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11335"
        ]
      },
      {
        "id": "CVE-2016-10270",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "LibTIFF 4.0.7 allows remote attackers to cause a denial of service (heap-based buffer over-read) or possibly have unspecified other impact via a crafted TIFF image, related to \"READ of size 8\" and libtiff/tif_read.c:523:22.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10270"
        ]
      },
      {
        "id": "CVE-2016-10268",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "tools/tiffcp.c in LibTIFF 4.0.7 allows remote attackers to cause a denial of service (integer underflow and heap-based buffer under-read) or possibly have unspecified other impact via a crafted TIFF image, related to \"READ of size 78490\" and libtiff/tif_unix.c:115:23.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10268"
        ]
      },
      {
        "id": "CVE-2016-9539",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "tools/tiffcrop.c in libtiff 4.0.6 has an out-of-bounds read in readContigTilesIntoBuffer(). Reported as MSVR 35092.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9539"
        ]
      },
      {
        "id": "CVE-2016-10267",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "LibTIFF 4.0.7 allows remote attackers to cause a denial of service (divide-by-zero error and application crash) via a crafted TIFF image, related to libtiff/tif_ojpeg.c:816:8.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10267"
        ]
      },
      {
        "id": "CVE-2017-7593",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "tif_read.c in LibTIFF 4.0.7 does not ensure that tif_rawdata is properly initialized, which might allow remote attackers to obtain sensitive information from process memory via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7593"
        ]
      },
      {
        "id": "CVE-2018-8905",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u6",
        "severity": "Medium",
        "description": "In LibTIFF 4.0.9, a heap-based buffer overflow occurs in the function LZWDecodeCompat in tif_lzw.c via a crafted TIFF file, as demonstrated by tiff2ps.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-8905"
        ]
      },
      {
        "id": "CVE-2017-9147",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u4",
        "severity": "Medium",
        "description": "LibTIFF 4.0.7 has an invalid read in the _TIFFVGetField function in tif_dir.c, which might allow remote attackers to cause a denial of service (crash) via a crafted TIFF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9147"
        ]
      },
      {
        "id": "CVE-2018-7456",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u6",
        "severity": "Medium",
        "description": "A NULL Pointer Dereference occurs in the function TIFFPrintDirectory in tif_print.c in LibTIFF 4.0.9 when using the tiffinfo tool to print crafted TIFF information, a different vulnerability than CVE-2017-18013. (This affects an earlier part of the TIFFPrintDirectory function that was not addressed by the CVE-2017-18013 patch.)",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-7456"
        ]
      },
      {
        "id": "CVE-2017-5563",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "LibTIFF version 4.0.7 is vulnerable to a heap-based buffer over-read in tif_lzw.c resulting in DoS or code execution via a crafted bmp image to tools/bmp2tiff.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5563"
        ]
      },
      {
        "id": "CVE-2018-17795",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u5",
        "severity": "Medium",
        "description": "The function t2p_write_pdf in tiff2pdf.c in LibTIFF 4.0.9 allows remote attackers to cause a denial of service (heap-based buffer overflow and application crash) or possibly have unspecified other impact via a crafted TIFF file, a similar issue to CVE-2017-9935.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-17795"
        ]
      },
      {
        "id": "CVE-2017-7601",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "LibTIFF 4.0.7 has a \"shift exponent too large for 64-bit type long\" undefined behavior issue, which might allow remote attackers to cause a denial of service (application crash) or possibly have unspecified other impact via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7601"
        ]
      },
      {
        "id": "CVE-2017-16232",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "** DISPUTED ** LibTIFF 4.0.8 has multiple memory leak vulnerabilities, which allow attackers to cause a denial of service (memory consumption), as demonstrated by tif_open.c, tif_lzw.c, and tif_aux.c. NOTE: Third parties were unable to reproduce the issue.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-16232"
        ]
      },
      {
        "id": "CVE-2017-7600",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "LibTIFF 4.0.7 has an \"outside the range of representable values of type unsigned char\" undefined behavior issue, which might allow remote attackers to cause a denial of service (application crash) or possibly have unspecified other impact via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7600"
        ]
      },
      {
        "id": "CVE-2019-7663",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u8",
        "severity": "Medium",
        "description": "An Invalid Address dereference was discovered in TIFFWriteDirectoryTagTransferfunction in libtiff/tif_dirwrite.c in LibTIFF 4.0.10, affecting the cpSeparateBufToContigBuf function in tiffcp.c. Remote attackers could leverage this vulnerability to cause a denial-of-service via a crafted tiff file. This is different from CVE-2018-12900.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-7663"
        ]
      },
      {
        "id": "CVE-2018-5784",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u6",
        "severity": "Medium",
        "description": "In LibTIFF 4.0.9, there is an uncontrolled resource consumption in the TIFFSetDirectory function of tif_dir.c. Remote attackers could leverage this vulnerability to cause a denial of service via a crafted tif file. This occurs because the declared number of directory entries is not validated against the actual number of directory entries.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-5784"
        ]
      },
      {
        "id": "CVE-2017-11613",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u6",
        "severity": "Low",
        "description": "In LibTIFF 4.0.8, there is a denial of service vulnerability in the TIFFOpen function. A crafted input will lead to a denial of service attack. During the TIFFOpen process, td_imagelength is not checked. The value of td_imagelength can be directly controlled by an input file. In the ChopUpSingleUncompressedStrip function, the _TIFFCheckMalloc function is called based on td_imagelength. If we set the value of td_imagelength close to the amount of system memory, it will hang the system or trigger the OOM killer.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11613"
        ]
      },
      {
        "id": "CVE-2016-10266",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "LibTIFF 4.0.7 allows remote attackers to cause a denial of service (divide-by-zero error and application crash) via a crafted TIFF image, related to libtiff/tif_read.c:351:22.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10266"
        ]
      },
      {
        "id": "CVE-2017-9117",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "In LibTIFF 4.0.7, the program processes BMP images without verifying that biWidth and biHeight in the bitmap-information header match the actual input, leading to a heap-based buffer over-read in bmp2tiff.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9117"
        ]
      },
      {
        "id": "CVE-2017-13726",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u5",
        "severity": "Medium",
        "description": "There is a reachable assertion abort in the function TIFFWriteDirectorySec() in LibTIFF 4.0.8, related to tif_dirwrite.c and a SubIFD tag. A crafted input will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13726"
        ]
      },
      {
        "id": "CVE-2017-7598",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Low",
        "description": "tif_dirread.c in LibTIFF 4.0.7 might allow remote attackers to cause a denial of service (divide-by-zero error and application crash) via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7598"
        ]
      },
      {
        "id": "CVE-2019-6128",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u10",
        "severity": "Negligible",
        "description": "The TIFFFdOpen function in tif_unix.c in LibTIFF 4.0.10 has a memory leak, as demonstrated by pal2rgb.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-6128"
        ]
      },
      {
        "id": "CVE-2016-10371",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u5",
        "severity": "Low",
        "description": "The TIFFWriteDirectoryTagCheckedRational function in tif_dirwrite.c in LibTIFF 4.0.6 allows remote attackers to cause a denial of service (assertion failure and application exit) via a crafted TIFF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10371"
        ]
      },
      {
        "id": "CVE-2017-9936",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u4",
        "severity": "Medium",
        "description": "In LibTIFF 4.0.8, there is a memory leak in tif_jbig.c. A crafted TIFF document can lead to a memory leak resulting in a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9936"
        ]
      },
      {
        "id": "CVE-2017-12944",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u5",
        "severity": "Medium",
        "description": "The TIFFReadDirEntryArray function in tif_read.c in LibTIFF 4.0.8 mishandles memory allocation for short files, which allows remote attackers to cause a denial of service (allocation failure and application crash) in the TIFFFetchStripThing function in tif_dirread.c during a tiff2pdf invocation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-12944"
        ]
      },
      {
        "id": "CVE-2014-8127",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "LibTIFF 4.0.3 allows remote attackers to cause a denial of service (out-of-bounds read and crash) via a crafted TIFF image to the (1) checkInkNamesString function in tif_dir.c in the thumbnail tool, (2) compresscontig function in tiff2bw.c in the tiff2bw tool, (3) putcontig8bitCIELab function in tif_getimage.c in the tiff2rgba tool, LZWPreDecode function in tif_lzw.c in the (4) tiff2ps or (5) tiffdither tool, (6) NeXTDecode function in tif_next.c in the tiffmedian tool, or (7) TIFFWriteDirectoryTagLongLong8Array function in tif_dirwrite.c in the tiffset tool.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2014-8127"
        ]
      },
      {
        "id": "CVE-2016-9535",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "High",
        "description": "tif_predict.h and tif_predict.c in libtiff 4.0.6 have assertions that can lead to assertion failures in debug mode, or buffer overflows in release mode, when dealing with unusual tile size like YCbCr with subsampling. Reported as MSVR 35105, aka \"Predictor heap-buffer-overflow.\"",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9535"
        ]
      },
      {
        "id": "CVE-2017-7592",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "The putagreytile function in tif_getimage.c in LibTIFF 4.0.7 has a left-shift undefined behavior issue, which might allow remote attackers to cause a denial of service (application crash) or possibly have unspecified other impact via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7592"
        ]
      },
      {
        "id": "CVE-2017-5225",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "High",
        "description": "LibTIFF version 4.0.7 is vulnerable to a heap buffer overflow in the tools/tiffcp resulting in DoS or code execution via a crafted BitsPerSample value.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5225"
        ]
      },
      {
        "id": "CVE-2017-9403",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u4",
        "severity": "Medium",
        "description": "In LibTIFF 4.0.7, a memory leak vulnerability was found in the function TIFFReadDirEntryLong8Array in tif_dirread.c, which allows attackers to cause a denial of service via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9403"
        ]
      },
      {
        "id": "CVE-2015-7554",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u4",
        "severity": "High",
        "description": "The _TIFFVGetField function in tif_dir.c in libtiff 4.0.6 allows attackers to cause a denial of service (invalid memory write and crash) or possibly have unspecified other impact via crafted field data in an extension tag in a TIFF image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-7554"
        ]
      },
      {
        "id": "CVE-2017-17942",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Low",
        "description": "In LibTIFF 4.0.9, there is a heap-based buffer over-read in the function PackBitsEncode in tif_packbits.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-17942"
        ]
      },
      {
        "id": "CVE-2018-10126",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "LibTIFF 4.0.9 has a NULL pointer dereference in the jpeg_fdct_16x16 function in jfdctint.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-10126"
        ]
      },
      {
        "id": "CVE-2017-7595",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Low",
        "description": "The JPEGSetupEncode function in tiff_jpeg.c in LibTIFF 4.0.7 allows remote attackers to cause a denial of service (divide-by-zero error and application crash) via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7595"
        ]
      },
      {
        "id": "CVE-2017-9935",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u5",
        "severity": "Medium",
        "description": "In LibTIFF 4.0.8, there is a heap-based buffer overflow in the t2p_write_pdf function in tools/tiff2pdf.c. This heap overflow could lead to different damages. For example, a crafted TIFF document can lead to an out-of-bounds read in TIFFCleanup, an invalid free in TIFFClose or t2p_free, memory corruption in t2p_readwrite_pdf_image, or a double free in t2p_free. Given these possibilities, it probably could cause arbitrary code execution.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9935"
        ]
      },
      {
        "id": "CVE-2018-16335",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u6",
        "severity": "Medium",
        "description": "newoffsets handling in ChopUpSingleUncompressedStrip in tif_dirread.c in LibTIFF 4.0.9 allows remote attackers to cause a denial of service (heap-based buffer overflow and application crash) or possibly have unspecified other impact via a crafted TIFF file, as demonstrated by tiff2pdf. This is a different vulnerability than CVE-2018-15209.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16335"
        ]
      },
      {
        "id": "CVE-2015-7313",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Medium",
        "description": "LibTIFF allows remote attackers to cause a denial of service (memory consumption and crash) via a crafted tiff file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-7313"
        ]
      },
      {
        "id": "CVE-2017-7597",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "tif_dirread.c in LibTIFF 4.0.7 has an \"outside the range of representable values of type float\" undefined behavior issue, which might allow remote attackers to cause a denial of service (application crash) or possibly have unspecified other impact via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7597"
        ]
      },
      {
        "id": "CVE-2018-18661",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u10",
        "severity": "Negligible",
        "description": "An issue was discovered in LibTIFF 4.0.9. There is a NULL pointer dereference in the function LZWDecode in the file tif_lzw.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-18661"
        ]
      },
      {
        "id": "CVE-2017-17973",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "** DISPUTED ** In LibTIFF 4.0.8, there is a heap-based use-after-free in the t2p_writeproc function in tiff2pdf.c. NOTE: there is a third-party report of inability to reproduce this issue.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-17973"
        ]
      },
      {
        "id": "CVE-2017-9815",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u4",
        "severity": "Medium",
        "description": "In LibTIFF 4.0.7, the TIFFReadDirEntryLong8Array function in libtiff/tif_dirread.c mishandles a malloc operation, which allows attackers to cause a denial of service (memory leak within the function _TIFFmalloc in tif_unix.c) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9815"
        ]
      },
      {
        "id": "CVE-2017-13727",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u5",
        "severity": "Medium",
        "description": "There is a reachable assertion abort in the function TIFFWriteDirectoryTagSubifd() in LibTIFF 4.0.8, related to tif_dirwrite.c and a SubIFD tag. A crafted input will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13727"
        ]
      },
      {
        "id": "CVE-2017-7599",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "LibTIFF 4.0.7 has an \"outside the range of representable values of type short\" undefined behavior issue, which might allow remote attackers to cause a denial of service (application crash) or possibly have unspecified other impact via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7599"
        ]
      },
      {
        "id": "CVE-2017-7594",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Low",
        "description": "The OJPEGReadHeaderInfoSecTablesDcTable function in tif_ojpeg.c in LibTIFF 4.0.7 allows remote attackers to cause a denial of service (memory leak) via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7594"
        ]
      },
      {
        "id": "CVE-2018-17100",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u7",
        "severity": "Low",
        "description": "An issue was discovered in LibTIFF 4.0.9. There is a int32 overflow in multiply_ms in tools/ppm2tiff.c, which can cause a denial of service (crash) or possibly have unspecified other impact via a crafted image file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-17100"
        ]
      },
      {
        "id": "CVE-2017-7596",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Medium",
        "description": "LibTIFF 4.0.7 has an \"outside the range of representable values of type float\" undefined behavior issue, which might allow remote attackers to cause a denial of service (application crash) or possibly have unspecified other impact via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7596"
        ]
      },
      {
        "id": "CVE-2018-12900",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u10",
        "severity": "Medium",
        "description": "Heap-based buffer overflow in the cpSeparateBufToContigBuf function in tiffcp.c in LibTIFF 4.0.9 allows remote attackers to cause a denial of service (crash) or possibly have unspecified other impact via a crafted TIFF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-12900"
        ]
      },
      {
        "id": "CVE-2010-2596",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The OJPEGPostDecode function in tif_ojpeg.c in LibTIFF 3.9.0 and 3.9.2, as used in tiff2ps, allows remote attackers to cause a denial of service (assertion failure and application exit) via a crafted TIFF image, related to \"downsampled OJPEG input.\"",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2010-2596"
        ]
      },
      {
        "id": "CVE-2018-5360",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "",
        "severity": "Medium",
        "description": "LibTIFF before 4.0.6 mishandles the reading of TIFF files, as demonstrated by a heap-based buffer over-read in the ReadTIFFImage function in coders/tiff.c in GraphicsMagick 1.3.27.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-5360"
        ]
      },
      {
        "id": "CVE-2016-3658",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u3",
        "severity": "Low",
        "description": "The TIFFWriteDirectoryTagLongLong8Array function in tif_dirwrite.c in the tiffset tool in LibTIFF 4.0.6 and earlier allows remote attackers to cause a denial of service (out-of-bounds read) via vectors involving the ma variable.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-3658"
        ]
      },
      {
        "id": "CVE-2018-19210",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u8",
        "severity": "Medium",
        "description": "In LibTIFF 4.0.9, there is a NULL pointer dereference in the TIFFWriteDirectorySec function in tif_dirwrite.c that will lead to a denial of service attack, as demonstrated by tiffset.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19210"
        ]
      },
      {
        "id": "CVE-2016-10095",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u4",
        "severity": "Medium",
        "description": "Stack-based buffer overflow in the _TIFFVGetField function in tif_dir.c in LibTIFF 4.0.7 allows remote attackers to cause a denial of service (crash) via a crafted TIFF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10095"
        ]
      },
      {
        "id": "CVE-2019-17546",
        "package": "tiff",
        "version": "4.0.3-12.3+deb8u2",
        "fix_version": "4.0.3-12.3+deb8u10",
        "severity": "Negligible",
        "description": "tif_getimage.c in LibTIFF through 4.0.10, as used in GDAL through 3.0.1 and other products, has an integer overflow that potentially causes a heap-based buffer overflow via a crafted RGBA image, related to a \"Negative-size-param\" condition.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-17546"
        ]
      },
      {
        "id": "CVE-2018-10845",
        "package": "gnutls28",
        "version": "3.3.8-6+deb8u4",
        "fix_version": "3.3.30-0+deb8u1",
        "severity": "Medium",
        "description": "It was found that the GnuTLS implementation of HMAC-SHA-384 was vulnerable to a Lucky thirteen style attack. Remote attackers could use this flaw to conduct distinguishing attacks and plain text recovery attacks via statistical analysis of timing data using crafted packets.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-10845"
        ]
      },
      {
        "id": "CVE-2018-10846",
        "package": "gnutls28",
        "version": "3.3.8-6+deb8u4",
        "fix_version": "3.3.30-0+deb8u1",
        "severity": "Low",
        "description": "A cache-based side channel in GnuTLS implementation that leads to plain text recovery in cross-VM attack setting was found. An attacker could use a combination of \"Just in Time\" Prime+probe attack in combination with Lucky-13 attack to recover plain text using crafted packets.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-10846"
        ]
      },
      {
        "id": "CVE-2017-7869",
        "package": "gnutls28",
        "version": "3.3.8-6+deb8u4",
        "fix_version": "3.3.8-6+deb8u5",
        "severity": "Medium",
        "description": "GnuTLS before 2017-02-20 has an out-of-bounds write caused by an integer overflow and heap-based buffer overflow related to the cdk_pkt_read function in opencdk/read-packet.c. This issue (which is a subset of the vendor's GNUTLS-SA-2017-3 report) is fixed in 3.5.10.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7869"
        ]
      },
      {
        "id": "CVE-2017-5334",
        "package": "gnutls28",
        "version": "3.3.8-6+deb8u4",
        "fix_version": "3.3.8-6+deb8u5",
        "severity": "High",
        "description": "Double free vulnerability in the gnutls_x509_ext_import_proxy function in GnuTLS before 3.3.26 and 3.5.x before 3.5.8 allows remote attackers to have unspecified impact via crafted policy language information in an X.509 certificate with a Proxy Certificate Information extension.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5334"
        ]
      },
      {
        "id": "CVE-2017-7507",
        "package": "gnutls28",
        "version": "3.3.8-6+deb8u4",
        "fix_version": "3.3.8-6+deb8u6",
        "severity": "Medium",
        "description": "GnuTLS version 3.5.12 and earlier is vulnerable to a NULL pointer dereference while decoding a status response TLS extension with valid contents. This could lead to a crash of the GnuTLS server application.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7507"
        ]
      },
      {
        "id": "CVE-2018-10844",
        "package": "gnutls28",
        "version": "3.3.8-6+deb8u4",
        "fix_version": "3.3.30-0+deb8u1",
        "severity": "Medium",
        "description": "It was found that the GnuTLS implementation of HMAC-SHA-256 was vulnerable to a Lucky thirteen style attack. Remote attackers could use this flaw to conduct distinguishing attacks and plaintext-recovery attacks via statistical analysis of timing data using crafted packets.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-10844"
        ]
      },
      {
        "id": "CVE-2011-3389",
        "package": "gnutls28",
        "version": "3.3.8-6+deb8u4",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The SSL protocol, as used in certain configurations in Microsoft Windows and Microsoft Internet Explorer, Mozilla Firefox, Google Chrome, Opera, and other products, encrypts data by using CBC mode with chained initialization vectors, which allows man-in-the-middle attackers to obtain plaintext HTTP headers via a blockwise chosen-boundary attack (BCBA) on an HTTPS session, in conjunction with JavaScript code that uses (1) the HTML5 WebSocket API, (2) the Java URLConnection API, or (3) the Silverlight WebClient API, aka a \"BEAST\" attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2011-3389"
        ]
      },
      {
        "id": "CVE-2017-5335",
        "package": "gnutls28",
        "version": "3.3.8-6+deb8u4",
        "fix_version": "3.3.8-6+deb8u5",
        "severity": "Medium",
        "description": "The stream reading functions in lib/opencdk/read-packet.c in GnuTLS before 3.3.26 and 3.5.x before 3.5.8 allow remote attackers to cause a denial of service (out-of-memory error and crash) via a crafted OpenPGP certificate.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5335"
        ]
      },
      {
        "id": "CVE-2017-5336",
        "package": "gnutls28",
        "version": "3.3.8-6+deb8u4",
        "fix_version": "3.3.8-6+deb8u5",
        "severity": "High",
        "description": "Stack-based buffer overflow in the cdk_pk_get_keyid function in lib/opencdk/pubkey.c in GnuTLS before 3.3.26 and 3.5.x before 3.5.8 allows remote attackers to have unspecified impact via a crafted OpenPGP certificate.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5336"
        ]
      },
      {
        "id": "CVE-2017-5337",
        "package": "gnutls28",
        "version": "3.3.8-6+deb8u4",
        "fix_version": "3.3.8-6+deb8u5",
        "severity": "High",
        "description": "Multiple heap-based buffer overflows in the read_attribute function in GnuTLS before 3.3.26 and 3.5.x before 3.5.8 allow remote attackers to have unspecified impact via a crafted OpenPGP certificate.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5337"
        ]
      },
      {
        "id": "CVE-2018-16868",
        "package": "gnutls28",
        "version": "3.3.8-6+deb8u4",
        "fix_version": "",
        "severity": "Low",
        "description": "A Bleichenbacher type side-channel based padding oracle attack was found in the way gnutls handles verification of RSA decrypted PKCS#1 v1.5 data. An attacker who is able to run process on the same physical core as the victim process, could use this to extract plaintext or in some cases downgrade any TLS connections to a vulnerable server.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16868"
        ]
      },
      {
        "id": "CVE-2018-14048",
        "package": "libpng",
        "version": "1.2.50-2+deb8u3",
        "fix_version": "",
        "severity": "Negligible",
        "description": "An issue has been found in libpng 1.6.34. It is a SEGV in the function png_free_data in png.c, related to the recommended error handling for png_read_image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-14048"
        ]
      },
      {
        "id": "CVE-2018-14550",
        "package": "libpng",
        "version": "1.2.50-2+deb8u3",
        "fix_version": "",
        "severity": "Negligible",
        "description": "An issue has been found in third-party PNM decoding associated with libpng 1.6.35. It is a stack-based buffer overflow in the function get_token in pnm2png.c in pnm2png.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-14550"
        ]
      },
      {
        "id": "CVE-2019-6129",
        "package": "libpng",
        "version": "1.2.50-2+deb8u3",
        "fix_version": "",
        "severity": "Negligible",
        "description": "** DISPUTED ** png_create_info_struct in png.c in libpng 1.6.36 has a memory leak, as demonstrated by pngcp. NOTE: a third party has stated \"I don't think it is libpng's job to free this buffer.\"",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-6129"
        ]
      },
      {
        "id": "CVE-2019-17371",
        "package": "libpng",
        "version": "1.2.50-2+deb8u3",
        "fix_version": "",
        "severity": "Negligible",
        "description": "gif2png 2.5.13 has a memory leak in the writefile function.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-17371"
        ]
      },
      {
        "id": "CVE-2018-16435",
        "package": "lcms2",
        "version": "2.6-3",
        "fix_version": "2.6-3+deb8u2",
        "severity": "Negligible",
        "description": "Little CMS (aka Little Color Management System) 2.9 has an integer overflow in the AllocateDataSet function in cmscgats.c, leading to a heap-based buffer overflow in the SetData function via a crafted file in the second argument to cmsIT8LoadFromFile.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16435"
        ]
      },
      {
        "id": "CVE-2016-10165",
        "package": "lcms2",
        "version": "2.6-3",
        "fix_version": "2.6-3+deb8u1",
        "severity": "Medium",
        "description": "The Type_MLU_Read function in cmstypes.c in Little CMS (aka lcms2) allows remote attackers to obtain sensitive information or cause a denial of service via an image with a crafted ICC profile, which triggers an out-of-bounds heap read.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10165"
        ]
      },
      {
        "id": "CVE-2018-11214",
        "package": "libjpeg-turbo",
        "version": "1:1.3.1-12",
        "fix_version": "1:1.3.1-12+deb8u1",
        "severity": "Low",
        "description": "An issue was discovered in libjpeg 9a. The get_text_rgb_row function in rdppm.c allows remote attackers to cause a denial of service (Segmentation fault) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-11214"
        ]
      },
      {
        "id": "CVE-2016-3616",
        "package": "libjpeg-turbo",
        "version": "1:1.3.1-12",
        "fix_version": "1:1.3.1-12+deb8u1",
        "severity": "Negligible",
        "description": "The cjpeg utility in libjpeg allows remote attackers to cause a denial of service (NULL pointer dereference and application crash) or execute arbitrary code via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-3616"
        ]
      },
      {
        "id": "CVE-2017-15232",
        "package": "libjpeg-turbo",
        "version": "1:1.3.1-12",
        "fix_version": "",
        "severity": "Negligible",
        "description": "libjpeg-turbo 1.5.2 has a NULL Pointer Dereference in jdpostct.c and jquant1.c via a crafted JPEG file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-15232"
        ]
      },
      {
        "id": "CVE-2018-14498",
        "package": "libjpeg-turbo",
        "version": "1:1.3.1-12",
        "fix_version": "1:1.3.1-12+deb8u2",
        "severity": "Low",
        "description": "get_8bit_row in rdbmp.c in libjpeg-turbo through 1.5.90 and MozJPEG through 3.3.1 allows attackers to cause a denial of service (heap-based buffer over-read and application crash) via a crafted 8-bit BMP in which one or more of the color indices is out of range for the number of palette entries.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-14498"
        ]
      },
      {
        "id": "CVE-2018-1152",
        "package": "libjpeg-turbo",
        "version": "1:1.3.1-12",
        "fix_version": "1:1.3.1-12+deb8u1",
        "severity": "Low",
        "description": "libjpeg-turbo 1.5.90 is vulnerable to a denial of service vulnerability caused by a divide by zero when processing a crafted BMP image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1152"
        ]
      },
      {
        "id": "CVE-2018-11212",
        "package": "libjpeg-turbo",
        "version": "1:1.3.1-12",
        "fix_version": "1:1.3.1-12+deb8u1",
        "severity": "Low",
        "description": "An issue was discovered in libjpeg 9a. The alloc_sarray function in jmemmgr.c allows remote attackers to cause a denial of service (divide-by-zero error) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-11212"
        ]
      },
      {
        "id": "CVE-2018-11213",
        "package": "libjpeg-turbo",
        "version": "1:1.3.1-12",
        "fix_version": "1:1.3.1-12+deb8u1",
        "severity": "Low",
        "description": "An issue was discovered in libjpeg 9a. The get_text_gray_row function in rdppm.c allows remote attackers to cause a denial of service (Segmentation fault) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-11213"
        ]
      },
      {
        "id": "CVE-2019-2201",
        "package": "libjpeg-turbo",
        "version": "1:1.3.1-12",
        "fix_version": "",
        "severity": "Low",
        "description": "In generate_jsimd_ycc_rgb_convert_neon of jsimd_arm64_neon.S, there is a possible out of bounds write due to a missing bounds check. This could lead to remote code execution in an unprivileged process with no additional execution privileges needed. User interaction is needed for exploitation.Product: AndroidVersions: Android-8.0 Android-8.1 Android-9 Android-10Android ID: A-120551338",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-2201"
        ]
      },
      {
        "id": "CVE-2015-2305",
        "package": "llvm-toolchain-3.5",
        "version": "1:3.5-10",
        "fix_version": "",
        "severity": "Low",
        "description": "Integer overflow in the regcomp implementation in the Henry Spencer BSD regex library (aka rxspencer) alpha3.8.g5 on 32-bit platforms, as used in NetBSD through 6.1.5 and other products, might allow context-dependent attackers to execute arbitrary code via a large regular expression that leads to a heap-based buffer overflow.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-2305"
        ]
      },
      {
        "id": "CVE-2018-7169",
        "package": "shadow",
        "version": "1:4.2-3+deb8u1",
        "fix_version": "",
        "severity": "Low",
        "description": "An issue was discovered in shadow 4.5. newgidmap (in shadow-utils) is setuid and allows an unprivileged user to be placed in a user namespace where setgroups(2) is permitted. This allows an attacker to remove themselves from a supplementary group, which may allow access to certain filesystem paths if the administrator has used \"group blacklisting\" (e.g., chmod g-rwx) to restrict access to paths. This flaw effectively reverts a security feature in the kernel (in particular, the /proc/self/setgroups knob) to prevent this sort of privilege escalation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-7169"
        ]
      },
      {
        "id": "CVE-2013-4235",
        "package": "shadow",
        "version": "1:4.2-3+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "shadow: TOCTOU (time-of-check time-of-use) race condition when copying and removing directory trees",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2013-4235"
        ]
      },
      {
        "id": "CVE-2017-12424",
        "package": "shadow",
        "version": "1:4.2-3+deb8u1",
        "fix_version": "",
        "severity": "High",
        "description": "In shadow before 4.5, the newusers tool could be made to manipulate internal data structures in ways unintended by the authors. Malformed input may lead to crashes (with a buffer overflow or other memory corruption) or other unspecified behaviors. This crosses a privilege boundary in, for example, certain web-hosting environments in which a Control Panel allows an unprivileged user account to create subaccounts.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-12424"
        ]
      },
      {
        "id": "CVE-2016-6252",
        "package": "shadow",
        "version": "1:4.2-3+deb8u1",
        "fix_version": "1:4.2-3+deb8u3",
        "severity": "Medium",
        "description": "Integer overflow in shadow 4.2.1 allows local users to gain privileges via crafted input to newuidmap.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-6252"
        ]
      },
      {
        "id": "CVE-2007-5686",
        "package": "shadow",
        "version": "1:4.2-3+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "initscripts in rPath Linux 1 sets insecure permissions for the /var/log/btmp file, which allows local users to obtain sensitive information regarding authentication attempts.  NOTE: because sshd detects the insecure permissions and does not log certain events, this also prevents sshd from logging failed authentication attempts by remote attackers.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2007-5686"
        ]
      },
      {
        "id": "CVE-2017-2616",
        "package": "shadow",
        "version": "1:4.2-3+deb8u1",
        "fix_version": "1:4.2-3+deb8u3",
        "severity": "Negligible",
        "description": "A race condition was found in util-linux before 2.32.1 in the way su handled the management of child processes. A local authenticated attacker could use this flaw to kill other processes with root privileges under specific conditions.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-2616"
        ]
      },
      {
        "id": "CVE-2019-19882",
        "package": "shadow",
        "version": "1:4.2-3+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "shadow 4.8, in certain circumstances affecting at least Gentoo, Arch Linux, and Void Linux, allows local users to obtain root access because setuid programs are misconfigured. Specifically, this affects shadow 4.8 when compiled using --with-libpam but without explicitly passing --disable-account-tools-setuid, and without a PAM configuration suitable for use with setuid account management tools. This combination leads to account management tools (groupadd, groupdel, groupmod, useradd, userdel, usermod) that can easily be used by unprivileged local users to escalate privileges to root in multiple ways. This issue became much more relevant in approximately December 2019 when an unrelated bug was fixed (i.e., the chmod calls to suidusbins were fixed in the upstream Makefile which is now included in the release version 4.8).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-19882"
        ]
      },
      {
        "id": "CVE-2019-3857",
        "package": "libssh2",
        "version": "1.4.3-4.1+deb8u1",
        "fix_version": "1.4.3-4.1+deb8u2",
        "severity": "Medium",
        "description": "An integer overflow flaw which could lead to an out of bounds write was discovered in libssh2 before 1.8.1 in the way SSH_MSG_CHANNEL_REQUEST packets with an exit signal are parsed. A remote attacker who compromises a SSH server may be able to execute code on the client system when a user connects to the server.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3857"
        ]
      },
      {
        "id": "CVE-2019-3855",
        "package": "libssh2",
        "version": "1.4.3-4.1+deb8u1",
        "fix_version": "1.4.3-4.1+deb8u2",
        "severity": "Critical",
        "description": "An integer overflow flaw which could lead to an out of bounds write was discovered in libssh2 before 1.8.1 in the way packets are read from the server. A remote attacker who compromises a SSH server may be able to execute code on the client system when a user connects to the server.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3855"
        ]
      },
      {
        "id": "CVE-2019-3860",
        "package": "libssh2",
        "version": "1.4.3-4.1+deb8u1",
        "fix_version": "1.4.3-4.1+deb8u5",
        "severity": "Medium",
        "description": "An out of bounds read flaw was discovered in libssh2 before 1.8.1 in the way SFTP packets with empty payloads are parsed. A remote attacker who compromises a SSH server may be able to cause a Denial of Service or read data in the client memory.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3860"
        ]
      },
      {
        "id": "CVE-2019-3862",
        "package": "libssh2",
        "version": "1.4.3-4.1+deb8u1",
        "fix_version": "1.4.3-4.1+deb8u2",
        "severity": "Medium",
        "description": "An out of bounds read flaw was discovered in libssh2 before 1.8.1 in the way SSH_MSG_CHANNEL_REQUEST packets with an exit status message and no payload are parsed. A remote attacker who compromises a SSH server may be able to cause a Denial of Service or read data in the client memory.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3862"
        ]
      },
      {
        "id": "CVE-2019-3859",
        "package": "libssh2",
        "version": "1.4.3-4.1+deb8u1",
        "fix_version": "1.4.3-4.1+deb8u4",
        "severity": "Medium",
        "description": "An out of bounds read flaw was discovered in libssh2 before 1.8.1 in the _libssh2_packet_require and _libssh2_packet_requirev functions. A remote attacker who compromises a SSH server may be able to cause a Denial of Service or read data in the client memory.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3859"
        ]
      },
      {
        "id": "CVE-2019-13115",
        "package": "libssh2",
        "version": "1.4.3-4.1+deb8u1",
        "fix_version": "1.4.3-4.1+deb8u4",
        "severity": "Medium",
        "description": "In libssh2 before 1.9.0, kex_method_diffie_hellman_group_exchange_sha256_key_exchange in kex.c has an integer overflow that could lead to an out-of-bounds read in the way packets are read from the server. A remote attacker who compromises a SSH server may be able to disclose sensitive information or cause a denial of service condition on the client system when a user connects to the server. This is related to an _libssh2_check_length mistake, and is different from the various issues fixed in 1.8.1, such as CVE-2019-3855.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-13115"
        ]
      },
      {
        "id": "CVE-2019-3858",
        "package": "libssh2",
        "version": "1.4.3-4.1+deb8u1",
        "fix_version": "1.4.3-4.1+deb8u2",
        "severity": "Medium",
        "description": "An out of bounds read flaw was discovered in libssh2 before 1.8.1 when a specially crafted SFTP packet is received from the server. A remote attacker who compromises a SSH server may be able to cause a Denial of Service or read data in the client memory.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3858"
        ]
      },
      {
        "id": "CVE-2019-3856",
        "package": "libssh2",
        "version": "1.4.3-4.1+deb8u1",
        "fix_version": "1.4.3-4.1+deb8u2",
        "severity": "Medium",
        "description": "An integer overflow flaw, which could lead to an out of bounds write, was discovered in libssh2 before 1.8.1 in the way keyboard prompt requests are parsed. A remote attacker who compromises a SSH server may be able to execute code on the client system when a user connects to the server.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3856"
        ]
      },
      {
        "id": "CVE-2019-17498",
        "package": "libssh2",
        "version": "1.4.3-4.1+deb8u1",
        "fix_version": "1.4.3-4.1+deb8u6",
        "severity": "Low",
        "description": "In libssh2 v1.9.0 and earlier versions, the SSH_MSG_DISCONNECT logic in packet.c has an integer overflow in a bounds check, enabling an attacker to specify an arbitrary (out-of-bounds) offset for a subsequent memory read. A crafted SSH server may be able to disclose sensitive information or cause a denial of service condition on the client system when a user connects to the server.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-17498"
        ]
      },
      {
        "id": "CVE-2019-3861",
        "package": "libssh2",
        "version": "1.4.3-4.1+deb8u1",
        "fix_version": "1.4.3-4.1+deb8u2",
        "severity": "Medium",
        "description": "An out of bounds read flaw was discovered in libssh2 before 1.8.1 in the way SSH packets with a padding length value greater than the packet length are parsed. A remote attacker who compromises a SSH server may be able to cause a Denial of Service or read data in the client memory.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3861"
        ]
      },
      {
        "id": "CVE-2019-3863",
        "package": "libssh2",
        "version": "1.4.3-4.1+deb8u1",
        "fix_version": "1.4.3-4.1+deb8u2",
        "severity": "Medium",
        "description": "A flaw was found in libssh2 before 1.8.1. A server could send a multiple keyboard interactive response messages whose total length are greater than unsigned char max characters. This value is used as an index to copy memory causing in an out of bounds memory write error.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3863"
        ]
      },
      {
        "id": "CVE-2018-5709",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "An issue was discovered in MIT Kerberos 5 (aka krb5) through 1.16. There is a variable \"dbentry-\u003en_key_data\" in kadmin/dbutil/dump.c that can store 16-bit data but unknowingly the developer has assigned a \"u4\" variable to it, which is for 32-bit data. An attacker can use this vulnerability to affect other artifacts of the database as we know that a Kerberos database dump file contains trusted data.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-5709"
        ]
      },
      {
        "id": "CVE-2017-11462",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "",
        "severity": "Low",
        "description": "Double free vulnerability in MIT Kerberos 5 (aka krb5) allows attackers to have unspecified impact via vectors involving automatic deletion of security contexts on error.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11462"
        ]
      },
      {
        "id": "CVE-2018-5730",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "1.12.1+dfsg-19+deb8u5",
        "severity": "Medium",
        "description": "MIT krb5 1.6 or later allows an authenticated kadmin with permission to add principals to an LDAP Kerberos database to circumvent a DN containership check by supplying both a \"linkdn\" and \"containerdn\" database argument, or by supplying a DN string which is a left extension of a container DN string but is not hierarchically within the container DN.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-5730"
        ]
      },
      {
        "id": "CVE-2017-15088",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "plugins/preauth/pkinit/pkinit_crypto_openssl.c in MIT Kerberos 5 (aka krb5) through 1.15.2 mishandles Distinguished Name (DN) fields, which allows remote attackers to execute arbitrary code or cause a denial of service (buffer overflow and application crash) in situations involving untrusted X.509 data, related to the get_matching_data and X509_NAME_oneline_ex functions. NOTE: this has security relevance only in use cases outside of the MIT Kerberos distribution, e.g., the use of get_matching_data in KDC certauth plugin code that is specific to Red Hat.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-15088"
        ]
      },
      {
        "id": "CVE-2018-20217",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "1.12.1+dfsg-19+deb8u5",
        "severity": "Low",
        "description": "A Reachable Assertion issue was discovered in the KDC in MIT Kerberos 5 (aka krb5) before 1.17. If an attacker can obtain a krbtgt ticket using an older encryption type (single-DES, triple-DES, or RC4), the attacker can crash the KDC by making an S4U2Self request.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20217"
        ]
      },
      {
        "id": "CVE-2018-5729",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "1.12.1+dfsg-19+deb8u5",
        "severity": "Medium",
        "description": "MIT krb5 1.6 or later allows an authenticated kadmin with permission to add principals to an LDAP Kerberos database to cause a denial of service (NULL pointer dereference) or bypass a DN container check by supplying tagged data that is internal to the database module.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-5729"
        ]
      },
      {
        "id": "CVE-2004-0971",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The krb5-send-pr script in the kerberos5 (krb5) package in Trustix Secure Linux 1.5 through 2.1, and possibly other operating systems, allows local users to overwrite files via a symlink attack on temporary files.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2004-0971"
        ]
      },
      {
        "id": "CVE-2017-11368",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "1.12.1+dfsg-19+deb8u3",
        "severity": "Medium",
        "description": "In MIT Kerberos 5 (aka krb5) 1.7 and later, an authenticated attacker can cause a KDC assertion failure by sending invalid S4U2Self or S4U2Proxy requests.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11368"
        ]
      },
      {
        "id": "CVE-2016-3119",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "1.12.1+dfsg-19+deb8u3",
        "severity": "Low",
        "description": "The process_db_args function in plugins/kdb/ldap/libkdb_ldap/ldap_principal2.c in the LDAP KDB module in kadmind in MIT Kerberos 5 (aka krb5) through 1.13.4 and 1.14.x through 1.14.1 mishandles the DB argument, which allows remote authenticated users to cause a denial of service (NULL pointer dereference and daemon crash) via a crafted request to modify a principal.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-3119"
        ]
      },
      {
        "id": "CVE-2018-5710",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "",
        "severity": "Medium",
        "description": "An issue was discovered in MIT Kerberos 5 (aka krb5) through 1.16. The pre-defined function \"strlen\" is getting a \"NULL\" string as a parameter value in plugins/kdb/ldap/libkdb_ldap/ldap_principal2.c in the Key Distribution Center (KDC), which allows remote authenticated users to cause a denial of service (NULL pointer dereference) via a modified kadmin client.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-5710"
        ]
      },
      {
        "id": "CVE-2015-2694",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "1.12.1+dfsg-19+deb8u3",
        "severity": "Medium",
        "description": "The kdcpreauth modules in MIT Kerberos 5 (aka krb5) 1.12.x and 1.13.x before 1.13.2 do not properly track whether a client's request has been validated, which allows remote attackers to bypass an intended preauthentication requirement by providing (1) zero bytes of data or (2) an arbitrary realm name, related to plugins/preauth/otp/main.c and plugins/preauth/pkinit/pkinit_srv.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-2694"
        ]
      },
      {
        "id": "CVE-2016-3120",
        "package": "krb5",
        "version": "1.12.1+dfsg-19+deb8u2",
        "fix_version": "1.12.1+dfsg-19+deb8u3",
        "severity": "Medium",
        "description": "The validate_as_request function in kdc_util.c in the Key Distribution Center (KDC) in MIT Kerberos 5 (aka krb5) before 1.13.6 and 1.4.x before 1.14.3, when restrict_anonymous_to_tgt is enabled, uses an incorrect client data structure, which allows remote authenticated users to cause a denial of service (NULL pointer dereference and daemon crash) via an S4U2Self request.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-3120"
        ]
      },
      {
        "id": "CVE-2017-15422",
        "package": "icu",
        "version": "52.1-8+deb8u4",
        "fix_version": "52.1-8+deb8u7",
        "severity": "Medium",
        "description": "Integer overflow in international date handling in International Components for Unicode (ICU) for C/C++ before 60.1, as used in V8 in Google Chrome prior to 63.0.3239.84 and other products, allowed a remote attacker to perform an out of bounds memory read via a crafted HTML page.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-15422"
        ]
      },
      {
        "id": "CVE-2017-7867",
        "package": "icu",
        "version": "52.1-8+deb8u4",
        "fix_version": "52.1-8+deb8u5",
        "severity": "Medium",
        "description": "International Components for Unicode (ICU) for C/C++ before 2017-02-13 has an out-of-bounds write caused by a heap-based buffer overflow related to the utf8TextAccess function in common/utext.cpp and the utext_setNativeIndex* function.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7867"
        ]
      },
      {
        "id": "CVE-2017-7868",
        "package": "icu",
        "version": "52.1-8+deb8u4",
        "fix_version": "52.1-8+deb8u5",
        "severity": "Medium",
        "description": "International Components for Unicode (ICU) for C/C++ before 2017-02-13 has an out-of-bounds write caused by a heap-based buffer overflow related to the utf8TextAccess function in common/utext.cpp and the utext_moveIndex32* function.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7868"
        ]
      },
      {
        "id": "CVE-2017-14952",
        "package": "icu",
        "version": "52.1-8+deb8u4",
        "fix_version": "52.1-8+deb8u6",
        "severity": "High",
        "description": "Double free in i18n/zonemeta.cpp in International Components for Unicode (ICU) for C/C++ through 59.1 allows remote attackers to execute arbitrary code via a crafted string, aka a \"redundant UVector entry clean up function call\" issue.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14952"
        ]
      },
      {
        "id": "CVE-2020-10531",
        "package": "icu",
        "version": "52.1-8+deb8u4",
        "fix_version": "52.1-8+deb8u8",
        "severity": "Unknown",
        "description": "An issue was discovered in International Components for Unicode (ICU) for C/C++ through 66.1. An integer overflow, leading to a heap-based buffer overflow, exists in the UnicodeString::doAppend() function in common/unistr.cpp.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2020-10531"
        ]
      },
      {
        "id": "CVE-2017-11671",
        "package": "gcc-4.8",
        "version": "4.8.4-1",
        "fix_version": "",
        "severity": "Low",
        "description": "Under certain circumstances, the ix86_expand_builtin function in i386.c in GNU Compiler Collection (GCC) version 4.6, 4.7, 4.8, 4.9, 5 before 5.5, and 6 before 6.4 will generate instruction sequences that clobber the status flag of the RDRAND and RDSEED intrinsics before it can be read, potentially causing failures of these instructions to go unreported. This could potentially lead to less randomness in random number generation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11671"
        ]
      },
      {
        "id": "CVE-2018-12886",
        "package": "gcc-4.8",
        "version": "4.8.4-1",
        "fix_version": "",
        "severity": "Medium",
        "description": "stack_protect_prologue in cfgexpand.c and stack_protect_epilogue in function.c in GNU Compiler Collection (GCC) 4.1 through 8 (under certain circumstances) generate instruction sequences when targeting ARM targets that spill the address of the stack protector guard, which allows an attacker to bypass the protection of -fstack-protector, -fstack-protector-all, -fstack-protector-strong, and -fstack-protector-explicit against stack overflow by controlling what the stack canary is compared against.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-12886"
        ]
      },
      {
        "id": "CVE-2019-6462",
        "package": "cairo",
        "version": "1.14.0-2.1+deb8u2",
        "fix_version": "",
        "severity": "Low",
        "description": "An issue was discovered in cairo 1.16.0. There is an infinite loop in the function _arc_error_normalized in the file cairo-arc.c, related to _arc_max_angle_for_tolerance_normalized.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-6462"
        ]
      },
      {
        "id": "CVE-2017-7475",
        "package": "cairo",
        "version": "1.14.0-2.1+deb8u2",
        "fix_version": "",
        "severity": "Low",
        "description": "Cairo version 1.15.4 is vulnerable to a NULL pointer dereference related to the FT_Load_Glyph and FT_Render_Glyph resulting in an application crash.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7475"
        ]
      },
      {
        "id": "CVE-2018-18064",
        "package": "cairo",
        "version": "1.14.0-2.1+deb8u2",
        "fix_version": "",
        "severity": "Low",
        "description": "cairo through 1.15.14 has an out-of-bounds stack-memory write during processing of a crafted document by WebKitGTK+ because of the interaction between cairo-rectangular-scan-converter.c (the generate and render_rows functions) and cairo-image-compositor.c (the _cairo_image_spans_and_zero function).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-18064"
        ]
      },
      {
        "id": "CVE-2019-6461",
        "package": "cairo",
        "version": "1.14.0-2.1+deb8u2",
        "fix_version": "",
        "severity": "Low",
        "description": "An issue was discovered in cairo 1.16.0. There is an assertion problem in the function _cairo_arc_in_direction in the file cairo-arc.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-6461"
        ]
      },
      {
        "id": "CVE-2017-9814",
        "package": "cairo",
        "version": "1.14.0-2.1+deb8u2",
        "fix_version": "",
        "severity": "Low",
        "description": "cairo-truetype-subset.c in cairo 1.15.6 and earlier allows remote attackers to cause a denial of service (out-of-bounds read) because of mishandling of an unexpected malloc(0) call.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9814"
        ]
      },
      {
        "id": "CVE-2017-6892",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "In libsndfile version 1.0.28, an error in the \"aiff_read_chanmap()\" function (aiff.c) can be exploited to cause an out-of-bounds read memory access via a specially crafted AIFF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6892"
        ]
      },
      {
        "id": "CVE-2018-19758",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u3",
        "severity": "Medium",
        "description": "There is a heap-based buffer over-read at wav.c in wav_write_header in libsndfile 1.0.28 that will cause a denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19758"
        ]
      },
      {
        "id": "CVE-2017-7586",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "In libsndfile before 1.0.28, an error in the \"header_read()\" function (common.c) when handling ID3 tags can be exploited to cause a stack-based buffer overflow via a specially crafted FLAC file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7586"
        ]
      },
      {
        "id": "CVE-2017-8363",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u2",
        "severity": "Medium",
        "description": "The flac_buffer_copy function in flac.c in libsndfile 1.0.28 allows remote attackers to cause a denial of service (heap-based buffer over-read and application crash) via a crafted audio file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-8363"
        ]
      },
      {
        "id": "CVE-2019-3832",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u4",
        "severity": "Negligible",
        "description": "It was discovered the fix for CVE-2018-19758 (libsndfile) was not complete and still allows a read beyond the limits of a buffer in wav_write_header() function in wav.c. A local attacker may use this flaw to make the application crash.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3832"
        ]
      },
      {
        "id": "CVE-2017-7741",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "In libsndfile before 1.0.28, an error in the \"flac_buffer_copy()\" function (flac.c) can be exploited to cause a segmentation violation (with write memory access) via a specially crafted FLAC file during a resample attempt, a similar issue to CVE-2017-7585.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7741"
        ]
      },
      {
        "id": "CVE-2017-7742",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "In libsndfile before 1.0.28, an error in the \"flac_buffer_copy()\" function (flac.c) can be exploited to cause a segmentation violation (with read memory access) via a specially crafted FLAC file during a resample attempt, a similar issue to CVE-2017-7585.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7742"
        ]
      },
      {
        "id": "CVE-2018-19661",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u2",
        "severity": "Low",
        "description": "An issue was discovered in libsndfile 1.0.28. There is a buffer over-read in the function i2ulaw_array in ulaw.c that will lead to a denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19661"
        ]
      },
      {
        "id": "CVE-2017-14245",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u2",
        "severity": "Low",
        "description": "An out of bounds read in the function d2alaw_array() in alaw.c of libsndfile 1.0.28 may lead to a remote DoS attack or information disclosure, related to mishandling of the NAN and INFINITY floating-point values.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14245"
        ]
      },
      {
        "id": "CVE-2017-12562",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "",
        "severity": "High",
        "description": "Heap-based Buffer Overflow in the psf_binheader_writef function in common.c in libsndfile through 1.0.28 allows remote attackers to cause a denial of service (application crash) or possibly have unspecified other impact.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-12562"
        ]
      },
      {
        "id": "CVE-2017-8365",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u2",
        "severity": "Medium",
        "description": "The i2les_array function in pcm.c in libsndfile 1.0.28 allows remote attackers to cause a denial of service (buffer over-read and application crash) via a crafted audio file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-8365"
        ]
      },
      {
        "id": "CVE-2017-8362",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u2",
        "severity": "Medium",
        "description": "The flac_buffer_copy function in flac.c in libsndfile 1.0.28 allows remote attackers to cause a denial of service (invalid read and application crash) via a crafted audio file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-8362"
        ]
      },
      {
        "id": "CVE-2018-19662",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u2",
        "severity": "Low",
        "description": "An issue was discovered in libsndfile 1.0.28. There is a buffer over-read in the function i2alaw_array in alaw.c that will lead to a denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19662"
        ]
      },
      {
        "id": "CVE-2017-14634",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u2",
        "severity": "Medium",
        "description": "In libsndfile 1.0.28, a divide-by-zero error exists in the function double64_init() in double64.c, which may lead to DoS when playing a crafted audio file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14634"
        ]
      },
      {
        "id": "CVE-2017-7585",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "In libsndfile before 1.0.28, an error in the \"flac_buffer_copy()\" function (flac.c) can be exploited to cause a stack-based buffer overflow via a specially crafted FLAC file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7585"
        ]
      },
      {
        "id": "CVE-2018-19432",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u2",
        "severity": "Negligible",
        "description": "An issue was discovered in libsndfile 1.0.28. There is a NULL pointer dereference in the function sf_write_int in sndfile.c, which will lead to a denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19432"
        ]
      },
      {
        "id": "CVE-2017-8361",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u2",
        "severity": "Medium",
        "description": "The flac_buffer_copy function in flac.c in libsndfile 1.0.28 allows remote attackers to cause a denial of service (buffer overflow and application crash) or possibly have unspecified other impact via a crafted audio file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-8361"
        ]
      },
      {
        "id": "CVE-2018-13139",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u2",
        "severity": "Negligible",
        "description": "A stack-based buffer overflow in psf_memset in common.c in libsndfile 1.0.28 allows remote attackers to cause a denial of service (application crash) or possibly have unspecified other impact via a crafted audio file. The vulnerability can be triggered by the executable sndfile-deinterleave.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-13139"
        ]
      },
      {
        "id": "CVE-2017-16942",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "In libsndfile 1.0.25 (fixed in 1.0.26), a divide-by-zero error exists in the function wav_w64_read_fmt_chunk() in wav_w64.c, which may lead to DoS when playing a crafted audio file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-16942"
        ]
      },
      {
        "id": "CVE-2017-14246",
        "package": "libsndfile",
        "version": "1.0.25-9.1+deb8u1",
        "fix_version": "1.0.25-9.1+deb8u2",
        "severity": "Low",
        "description": "An out of bounds read in the function d2ulaw_array() in ulaw.c of libsndfile 1.0.28 may lead to a remote DoS attack or information disclosure, related to mishandling of the NAN and INFINITY floating-point values.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14246"
        ]
      },
      {
        "id": "CVE-2016-9401",
        "package": "bash",
        "version": "4.3-11+deb8u1",
        "fix_version": "4.3-11+deb8u2",
        "severity": "Low",
        "description": "popd in bash might allow local users to bypass the restricted shell and cause a use-after-free via a crafted address.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9401"
        ]
      },
      {
        "id": "CVE-2019-9924",
        "package": "bash",
        "version": "4.3-11+deb8u1",
        "fix_version": "4.3-11+deb8u2",
        "severity": "Low",
        "description": "rbash in Bash before 4.4-beta2 did not prevent the shell user from modifying BASH_CMDS, thus allowing the user to execute any command with the permissions of the shell.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-9924"
        ]
      },
      {
        "id": "CVE-2019-18276",
        "package": "bash",
        "version": "4.3-11+deb8u1",
        "fix_version": "",
        "severity": "Low",
        "description": "An issue was discovered in disable_priv_mode in shell.c in GNU Bash through 5.0 patch 11. By default, if Bash is run with its effective UID not equal to its real UID, it will drop privileges by setting its effective UID to its real UID. However, it does so incorrectly. On Linux and other systems that support \"saved UID\" functionality, the saved UID is not dropped. An attacker with command execution in the shell can use \"enable -f\" for runtime loading of a new builtin, which can be a shared object that calls setuid() and therefore regains privileges. However, binaries running with an effective UID of 0 are unaffected.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-18276"
        ]
      },
      {
        "id": "CVE-2017-2862",
        "package": "gdk-pixbuf",
        "version": "2.31.1-2+deb8u5",
        "fix_version": "2.31.1-2+deb8u6",
        "severity": "Medium",
        "description": "An exploitable heap overflow vulnerability exists in the gdk_pixbuf__jpeg_image_load_increment functionality of Gdk-Pixbuf 2.36.6. A specially crafted jpeg file can cause a heap overflow resulting in remote code execution. An attacker can send a file or url to trigger this vulnerability.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-2862"
        ]
      },
      {
        "id": "CVE-2017-1000422",
        "package": "gdk-pixbuf",
        "version": "2.31.1-2+deb8u5",
        "fix_version": "2.31.1-2+deb8u7",
        "severity": "Medium",
        "description": "Gnome gdk-pixbuf 2.36.8 and older is vulnerable to several integer overflow in the gif_get_lzw function resulting in memory corruption and potential code execution",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000422"
        ]
      },
      {
        "id": "CVE-2017-6314",
        "package": "gdk-pixbuf",
        "version": "2.31.1-2+deb8u5",
        "fix_version": "2.31.1-2+deb8u8",
        "severity": "Low",
        "description": "The make_available_at_least function in io-tiff.c in gdk-pixbuf allows context-dependent attackers to cause a denial of service (infinite loop) via a large TIFF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6314"
        ]
      },
      {
        "id": "CVE-2017-6313",
        "package": "gdk-pixbuf",
        "version": "2.31.1-2+deb8u5",
        "fix_version": "2.31.1-2+deb8u8",
        "severity": "Low",
        "description": "Integer underflow in the load_resources function in io-icns.c in gdk-pixbuf allows context-dependent attackers to cause a denial of service (out-of-bounds read and program crash) via a crafted image entry size in an ICO file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6313"
        ]
      },
      {
        "id": "CVE-2017-6312",
        "package": "gdk-pixbuf",
        "version": "2.31.1-2+deb8u5",
        "fix_version": "2.31.1-2+deb8u8",
        "severity": "Low",
        "description": "Integer overflow in io-ico.c in gdk-pixbuf allows context-dependent attackers to cause a denial of service (segmentation fault and application crash) via a crafted image entry offset in an ICO file, which triggers an out-of-bounds read, related to compiler optimizations.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6312"
        ]
      },
      {
        "id": "CVE-2016-6352",
        "package": "gdk-pixbuf",
        "version": "2.31.1-2+deb8u5",
        "fix_version": "2.31.1-2+deb8u8",
        "severity": "Medium",
        "description": "The OneLine32 function in io-ico.c in gdk-pixbuf before 2.35.3 allows remote attackers to cause a denial of service (out-of-bounds write and crash) via crafted dimensions in an ICO file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-6352"
        ]
      },
      {
        "id": "CVE-2017-2870",
        "package": "gdk-pixbuf",
        "version": "2.31.1-2+deb8u5",
        "fix_version": "2.31.1-2+deb8u8",
        "severity": "Negligible",
        "description": "An exploitable integer overflow vulnerability exists in the tiff_image_parse functionality of Gdk-Pixbuf 2.36.6 when compiled with Clang. A specially crafted tiff file can cause a heap-overflow resulting in remote code execution. An attacker can send a file or a URL to trigger this vulnerability.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-2870"
        ]
      },
      {
        "id": "CVE-2016-9843",
        "package": "zlib",
        "version": "1:1.2.8.dfsg-2",
        "fix_version": "1:1.2.8.dfsg-2+deb8u1",
        "severity": "High",
        "description": "The crc32_big function in crc32.c in zlib 1.2.8 might allow context-dependent attackers to have unspecified impact via vectors involving big-endian CRC calculation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9843"
        ]
      },
      {
        "id": "CVE-2016-9842",
        "package": "zlib",
        "version": "1:1.2.8.dfsg-2",
        "fix_version": "1:1.2.8.dfsg-2+deb8u1",
        "severity": "Medium",
        "description": "The inflateMark function in inflate.c in zlib 1.2.8 might allow context-dependent attackers to have unspecified impact via vectors involving left shifts of negative integers.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9842"
        ]
      },
      {
        "id": "CVE-2016-9840",
        "package": "zlib",
        "version": "1:1.2.8.dfsg-2",
        "fix_version": "1:1.2.8.dfsg-2+deb8u1",
        "severity": "Medium",
        "description": "inftrees.c in zlib 1.2.8 might allow context-dependent attackers to have unspecified impact by leveraging improper pointer arithmetic.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9840"
        ]
      },
      {
        "id": "CVE-2016-9841",
        "package": "zlib",
        "version": "1:1.2.8.dfsg-2",
        "fix_version": "1:1.2.8.dfsg-2+deb8u1",
        "severity": "High",
        "description": "inffast.c in zlib 1.2.8 might allow context-dependent attackers to have unspecified impact by leveraging improper pointer arithmetic.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9841"
        ]
      },
      {
        "id": "CVE-2019-12900",
        "package": "bzip2",
        "version": "1.0.6-7",
        "fix_version": "1.0.6-7+deb8u1",
        "severity": "High",
        "description": "BZ2_decompress in decompress.c in bzip2 through 1.0.6 has an out-of-bounds write when there are many selectors.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-12900"
        ]
      },
      {
        "id": "CVE-2016-3189",
        "package": "bzip2",
        "version": "1.0.6-7",
        "fix_version": "1.0.6-7+deb8u1",
        "severity": "Low",
        "description": "Use-after-free vulnerability in bzip2recover in bzip2 1.0.6 allows remote attackers to cause a denial of service (crash) via a crafted bzip2 file, related to block ends set to before the start of the block.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-3189"
        ]
      },
      {
        "id": "CVE-2017-17512",
        "package": "sensible-utils",
        "version": "0.0.9",
        "fix_version": "0.0.9+deb8u1",
        "severity": "Medium",
        "description": "sensible-browser in sensible-utils before 0.0.11 does not validate strings before launching the program specified by the BROWSER environment variable, which allows remote attackers to conduct argument-injection attacks via a crafted URL, as demonstrated by a --proxy-pac-file argument.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-17512"
        ]
      },
      {
        "id": "CVE-2017-7246",
        "package": "pcre3",
        "version": "2:8.35-3.3+deb8u4",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Stack-based buffer overflow in the pcre32_copy_substring function in pcre_get.c in libpcre1 in PCRE 8.40 allows remote attackers to cause a denial of service (WRITE of size 268) or possibly have unspecified other impact via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7246"
        ]
      },
      {
        "id": "CVE-2015-3217",
        "package": "pcre3",
        "version": "2:8.35-3.3+deb8u4",
        "fix_version": "",
        "severity": "Medium",
        "description": "PCRE 7.8 and 8.32 through 8.37, and PCRE2 10.10 mishandle group empty matches, which might allow remote attackers to cause a denial of service (stack-based buffer overflow) via a crafted regular expression, as demonstrated by /^(?:(?(1)\\\\.|([^\\\\\\\\W_])?)+)+$/.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-3217"
        ]
      },
      {
        "id": "CVE-2017-7244",
        "package": "pcre3",
        "version": "2:8.35-3.3+deb8u4",
        "fix_version": "",
        "severity": "Medium",
        "description": "The _pcre32_xclass function in pcre_xclass.c in libpcre1 in PCRE 8.40 allows remote attackers to cause a denial of service (invalid memory read) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7244"
        ]
      },
      {
        "id": "CVE-2017-16231",
        "package": "pcre3",
        "version": "2:8.35-3.3+deb8u4",
        "fix_version": "",
        "severity": "Negligible",
        "description": "** DISPUTED ** In PCRE 8.41, after compiling, a pcretest load test PoC produces a crash overflow in the function match() in pcre_exec.c because of a self-recursive call. NOTE: third parties dispute the relevance of this report, noting that there are options that can be used to limit the amount of stack that is used.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-16231"
        ]
      },
      {
        "id": "CVE-2017-7245",
        "package": "pcre3",
        "version": "2:8.35-3.3+deb8u4",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Stack-based buffer overflow in the pcre32_copy_substring function in pcre_get.c in libpcre1 in PCRE 8.40 allows remote attackers to cause a denial of service (WRITE of size 4) or possibly have unspecified other impact via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7245"
        ]
      },
      {
        "id": "CVE-2017-7186",
        "package": "pcre3",
        "version": "2:8.35-3.3+deb8u4",
        "fix_version": "",
        "severity": "Medium",
        "description": "libpcre1 in PCRE 8.40 and libpcre2 in PCRE2 10.23 allow remote attackers to cause a denial of service (segmentation violation for read access, and application crash) by triggering an invalid Unicode property lookup.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7186"
        ]
      },
      {
        "id": "CVE-2017-11164",
        "package": "pcre3",
        "version": "2:8.35-3.3+deb8u4",
        "fix_version": "",
        "severity": "Negligible",
        "description": "In PCRE 8.41, the OP_KETRMAX feature in the match function in pcre_exec.c allows stack exhaustion (uncontrolled recursion) when processing a crafted regular expression.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11164"
        ]
      },
      {
        "id": "CVE-2017-13089",
        "package": "wget",
        "version": "1.16-1+deb8u1",
        "fix_version": "1.16-1+deb8u4",
        "severity": "Critical",
        "description": "The http.c:skip_short_body() function is called in some circumstances, such as when processing redirects. When the response is sent chunked in wget before 1.19.2, the chunk parser uses strtol() to read each chunk's length, but doesn't check that the chunk length is a non-negative number. The code then tries to skip the chunk in pieces of 512 bytes by using the MIN() macro, but ends up passing the negative chunk length to connect.c:fd_read(). As fd_read() takes an int argument, the high 32 bits of the chunk length are discarded, leaving fd_read() with a completely attacker controlled length argument.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13089"
        ]
      },
      {
        "id": "CVE-2017-6508",
        "package": "wget",
        "version": "1.16-1+deb8u1",
        "fix_version": "1.16-1+deb8u2",
        "severity": "Medium",
        "description": "CRLF injection vulnerability in the url_parse function in url.c in Wget through 1.19.1 allows remote attackers to inject arbitrary HTTP headers via CRLF sequences in the host subcomponent of a URL.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6508"
        ]
      },
      {
        "id": "CVE-2019-5953",
        "package": "wget",
        "version": "1.16-1+deb8u1",
        "fix_version": "1.16-1+deb8u6",
        "severity": "High",
        "description": "Buffer overflow in GNU Wget 1.20.1 and earlier allows remote attackers to cause a denial-of-service (DoS) or may execute an arbitrary code via unspecified vectors.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-5953"
        ]
      },
      {
        "id": "CVE-2017-13090",
        "package": "wget",
        "version": "1.16-1+deb8u1",
        "fix_version": "1.16-1+deb8u4",
        "severity": "Critical",
        "description": "The retr.c:fd_read_body() function is called when processing OK responses. When the response is sent chunked in wget before 1.19.2, the chunk parser uses strtol() to read each chunk's length, but doesn't check that the chunk length is a non-negative number. The code then tries to read the chunk in pieces of 8192 bytes by using the MIN() macro, but ends up passing the negative chunk length to retr.c:fd_read(). As fd_read() takes an int argument, the high 32 bits of the chunk length are discarded, leaving fd_read() with a completely attacker controlled length argument. The attacker can corrupt malloc metadata after the allocated buffer.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13090"
        ]
      },
      {
        "id": "CVE-2018-0494",
        "package": "wget",
        "version": "1.16-1+deb8u1",
        "fix_version": "1.16-1+deb8u5",
        "severity": "Medium",
        "description": "GNU Wget before 1.19.5 is prone to a cookie injection vulnerability in the resp_new function in http.c via a \\r\\n sequence in a continuation line.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-0494"
        ]
      },
      {
        "id": "CVE-2016-7098",
        "package": "wget",
        "version": "1.16-1+deb8u1",
        "fix_version": "1.16-1+deb8u7",
        "severity": "Low",
        "description": "Race condition in wget 1.17 and earlier, when used in recursive or mirroring mode to download a single file, might allow remote servers to bypass intended access list restrictions by keeping an HTTP connection open.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7098"
        ]
      },
      {
        "id": "CVE-2017-7375",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u5",
        "severity": "High",
        "description": "A flaw in libxml2 allows remote XML entity inclusion with default parser flags (i.e., when the caller did not request entity substitution, DTD validation, external DTD subset loading, or default DTD attributes). Depending on the context, this may expose a higher-risk attack surface in libxml2 not usually reachable with default parser flags, and expose content from local files, HTTP, or FTP servers (which might be otherwise unreachable).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7375"
        ]
      },
      {
        "id": "CVE-2016-9318",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "",
        "severity": "Medium",
        "description": "libxml2 2.9.4 and earlier, as used in XMLSec 1.2.23 and earlier and other products, does not offer a flag directly indicating that the current document may be read but other files may not be opened, which makes it easier for remote attackers to conduct XML External Entity (XXE) attacks via a crafted document.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9318"
        ]
      },
      {
        "id": "CVE-2018-14404",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u7",
        "severity": "Low",
        "description": "A NULL pointer dereference vulnerability exists in the xpath.c:xmlXPathCompOpEval() function of libxml2 through 2.9.8 when parsing an invalid XPath expression in the XPATH_OP_AND or XPATH_OP_OR case. Applications processing untrusted XSL format inputs with the use of the libxml2 library may be vulnerable to a denial of service attack due to a crash of the application.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-14404"
        ]
      },
      {
        "id": "CVE-2017-9048",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u5",
        "severity": "Medium",
        "description": "libxml2 20904-GITv2.9.4-16-g0741801 is vulnerable to a stack-based buffer overflow. The function xmlSnprintfElementContent in valid.c is supposed to recursively dump the element content definition into a char buffer 'buf' of size 'size'. At the end of the routine, the function may strcat two more characters without checking whether the current strlen(buf) + 2 \u003c size. This vulnerability causes programs that use libxml2, such as PHP, to crash.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9048"
        ]
      },
      {
        "id": "CVE-2017-8872",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "",
        "severity": "Medium",
        "description": "The htmlParseTryOrFinish function in HTMLparser.c in libxml2 2.9.4 allows attackers to cause a denial of service (buffer over-read) or information disclosure.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-8872"
        ]
      },
      {
        "id": "CVE-2017-16932",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "",
        "severity": "Medium",
        "description": "parser.c in libxml2 before 2.9.5 does not prevent infinite recursion in parameter entities.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-16932"
        ]
      },
      {
        "id": "CVE-2017-7376",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u5",
        "severity": "Critical",
        "description": "Buffer overflow in libxml2 allows remote attackers to execute arbitrary code by leveraging an incorrect limit for port values when handling redirects.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7376"
        ]
      },
      {
        "id": "CVE-2018-14567",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u7",
        "severity": "Medium",
        "description": "libxml2 2.9.8, if --with-lzma is used, allows remote attackers to cause a denial of service (infinite loop) via a crafted XML file that triggers LZMA_MEMLIMIT_ERROR, as demonstrated by xmllint, a different vulnerability than CVE-2015-8035 and CVE-2018-9251.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-14567"
        ]
      },
      {
        "id": "CVE-2017-9049",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u5",
        "severity": "Medium",
        "description": "libxml2 20904-GITv2.9.4-16-g0741801 is vulnerable to a heap-based buffer over-read in the xmlDictComputeFastKey function in dict.c. This vulnerability causes programs that use libxml2, such as PHP, to crash. This vulnerability exists because of an incomplete fix for libxml2 Bug 759398.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9049"
        ]
      },
      {
        "id": "CVE-2017-18258",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u7",
        "severity": "Low",
        "description": "The xz_head function in xzlib.c in libxml2 before 2.9.6 allows remote attackers to cause a denial of service (memory consumption) via a crafted LZMA file, because the decoder functionality does not restrict memory usage to what is required for a legitimate file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-18258"
        ]
      },
      {
        "id": "CVE-2017-5130",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "",
        "severity": "Negligible",
        "description": "An integer overflow in xmlmemory.c in libxml2 before 2.9.5, as used in Google Chrome prior to 62.0.3202.62 and other products, allowed a remote attacker to potentially exploit heap corruption via a crafted XML file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5130"
        ]
      },
      {
        "id": "CVE-2017-16931",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u5",
        "severity": "High",
        "description": "parser.c in libxml2 before 2.9.5 mishandles parameter-entity references because the NEXTL macro calls the xmlParserHandlePEReference function in the case of a '%' character in a DTD name.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-16931"
        ]
      },
      {
        "id": "CVE-2017-9050",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u5",
        "severity": "Medium",
        "description": "libxml2 20904-GITv2.9.4-16-g0741801 is vulnerable to a heap-based buffer over-read in the xmlDictAddString function in dict.c. This vulnerability causes programs that use libxml2, such as PHP, to crash. This vulnerability exists because of an incomplete fix for CVE-2016-1839.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9050"
        ]
      },
      {
        "id": "CVE-2017-0663",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u5",
        "severity": "Medium",
        "description": "A remote code execution vulnerability in libxml2 could enable an attacker using a specially crafted file to execute arbitrary code within the context of an unprivileged process. This issue is rated as High due to the possibility of remote code execution in an application that uses this library. Product: Android. Versions: 4.4.4, 5.0.2, 5.1.1, 6.0, 6.0.1, 7.0, 7.1.1, 7.1.2. Android ID: A-37104170.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-0663"
        ]
      },
      {
        "id": "CVE-2017-9047",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u5",
        "severity": "Medium",
        "description": "A buffer overflow was discovered in libxml2 20904-GITv2.9.4-16-g0741801. The function xmlSnprintfElementContent in valid.c is supposed to recursively dump the element content definition into a char buffer 'buf' of size 'size'. The variable len is assigned strlen(buf). If the content-\u003etype is XML_ELEMENT_CONTENT_ELEMENT, then (i) the content-\u003eprefix is appended to buf (if it actually fits) whereupon (ii) content-\u003ename is written to the buffer. However, the check for whether the content-\u003ename actually fits also uses 'len' rather than the updated buffer length strlen(buf). This allows us to write about \"size\" many bytes beyond the allocated memory. This vulnerability causes programs that use libxml2, such as PHP, to crash.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9047"
        ]
      },
      {
        "id": "CVE-2016-4448",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "",
        "severity": "Critical",
        "description": "Format string vulnerability in libxml2 before 2.9.4 allows attackers to have unspecified impact via format string specifiers in unknown vectors.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-4448"
        ]
      },
      {
        "id": "CVE-2017-15412",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u6",
        "severity": "Medium",
        "description": "Use after free in libxml2 before 2.9.5, as used in Google Chrome prior to 63.0.3239.84 and other products, allowed a remote attacker to potentially exploit heap corruption via a crafted HTML page.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-15412"
        ]
      },
      {
        "id": "CVE-2017-5969",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "",
        "severity": "Low",
        "description": "** DISPUTED ** libxml2 2.9.4, when used in recover mode, allows remote attackers to cause a denial of service (NULL pointer dereference) via a crafted XML document.  NOTE: The maintainer states \"I would disagree of a CVE with the Recover parsing option which should only be used for manual recovery at least for XML parser.\"",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5969"
        ]
      },
      {
        "id": "CVE-2019-19956",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "2.9.1+dfsg1-5+deb8u8",
        "severity": "Medium",
        "description": "xmlParseBalancedChunkMemoryRecover in parser.c in libxml2 before 2.9.10 has a memory leak related to newDoc-\u003eoldNs.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-19956"
        ]
      },
      {
        "id": "CVE-2020-7595",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "",
        "severity": "Medium",
        "description": "xmlStringLenDecodeEntities in parser.c in libxml2 2.9.10 has an infinite loop in a certain end-of-file situation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2020-7595"
        ]
      },
      {
        "id": "CVE-2019-20388",
        "package": "libxml2",
        "version": "2.9.1+dfsg1-5+deb8u4",
        "fix_version": "",
        "severity": "Medium",
        "description": "xmlSchemaPreRun in xmlschemas.c in libxml2 2.9.10 allows an xmlSchemaValidateStream memory leak.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-20388"
        ]
      },
      {
        "id": "CVE-2017-13728",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "Medium",
        "description": "There is an infinite loop in the next_char function in comp_scan.c in ncurses 6.0, related to libtic. A crafted input will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13728"
        ]
      },
      {
        "id": "CVE-2017-11113",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "Medium",
        "description": "In ncurses 6.0, there is a NULL Pointer Dereference in the _nc_parse_entry function of tinfo/parse_entry.c. It could lead to a remote denial of service attack if the terminfo library code is used to process untrusted terminfo data.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11113"
        ]
      },
      {
        "id": "CVE-2017-13734",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "Medium",
        "description": "There is an illegal address access in the _nc_safe_strcat function in strings.c in ncurses 6.0 that will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13734"
        ]
      },
      {
        "id": "CVE-2018-19217",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "Medium",
        "description": "** DISPUTED ** In ncurses, possibly a 6.x version, there is a NULL pointer dereference at the function _nc_name_match that will lead to a denial of service attack. NOTE: the original report stated version 6.1, but the issue did not reproduce for that version according to the maintainer or a reliable third-party.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19217"
        ]
      },
      {
        "id": "CVE-2017-13731",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "Medium",
        "description": "There is an illegal address access in the function postprocess_termcap() in parse_entry.c in ncurses 6.0 that will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13731"
        ]
      },
      {
        "id": "CVE-2017-11112",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "Medium",
        "description": "In ncurses 6.0, there is an attempted 0xffffffffffffffff access in the append_acs function of tinfo/parse_entry.c. It could lead to a remote denial of service attack if the terminfo library code is used to process untrusted terminfo data.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11112"
        ]
      },
      {
        "id": "CVE-2017-13730",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "Medium",
        "description": "There is an illegal address access in the function _nc_read_entry_source() in progs/tic.c in ncurses 6.0 that might lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13730"
        ]
      },
      {
        "id": "CVE-2017-10685",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "High",
        "description": "In ncurses 6.0, there is a format string vulnerability in the fmt_entry function. A crafted input will lead to a remote arbitrary code execution attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-10685"
        ]
      },
      {
        "id": "CVE-2017-10684",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "High",
        "description": "In ncurses 6.0, there is a stack-based buffer overflow in the fmt_entry function. A crafted input will lead to a remote arbitrary code execution attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-10684"
        ]
      },
      {
        "id": "CVE-2018-19211",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "",
        "severity": "Low",
        "description": "In ncurses 6.1, there is a NULL pointer dereference at function _nc_parse_entry in parse_entry.c that will lead to a denial of service attack. The product proceeds to the dereference code path even after a \"dubious character `*' in name or alias field\" detection.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19211"
        ]
      },
      {
        "id": "CVE-2017-13733",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "Medium",
        "description": "There is an illegal address access in the fmt_entry function in progs/dump_entry.c in ncurses 6.0 that might lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13733"
        ]
      },
      {
        "id": "CVE-2017-13729",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "Medium",
        "description": "There is an illegal address access in the _nc_save_str function in alloc_entry.c in ncurses 6.0. It will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13729"
        ]
      },
      {
        "id": "CVE-2017-16879",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u3",
        "severity": "Medium",
        "description": "Stack-based buffer overflow in the _nc_write_entry function in tinfo/write_entry.c in ncurses 6.0 allows attackers to cause a denial of service (application crash) or possibly execute arbitrary code via a crafted terminfo file, as demonstrated by tic.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-16879"
        ]
      },
      {
        "id": "CVE-2017-13732",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "5.9+20140913-1+deb8u1",
        "severity": "Medium",
        "description": "There is an illegal address access in the function dump_uses() in progs/dump_entry.c in ncurses 6.0 that might lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13732"
        ]
      },
      {
        "id": "CVE-2019-17594",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "",
        "severity": "Low",
        "description": "There is a heap-based buffer over-read in the _nc_find_entry function in tinfo/comp_hash.c in the terminfo library in ncurses before 6.1-20191012.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-17594"
        ]
      },
      {
        "id": "CVE-2019-17595",
        "package": "ncurses",
        "version": "5.9+20140913-1",
        "fix_version": "",
        "severity": "Low",
        "description": "There is a heap-based buffer over-read in the fmt_entry function in tinfo/comp_hash.c in the terminfo library in ncurses before 6.1-20191012.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-17595"
        ]
      },
      {
        "id": "CVE-2011-3374",
        "package": "apt",
        "version": "1.0.9.8.4",
        "fix_version": "",
        "severity": "Negligible",
        "description": "It was found that apt-key in apt, all versions, do not correctly validate gpg keys with the master keyring, leading to a potential man-in-the-middle attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2011-3374"
        ]
      },
      {
        "id": "CVE-2019-3462",
        "package": "apt",
        "version": "1.0.9.8.4",
        "fix_version": "1.0.9.8.5",
        "severity": "Critical",
        "description": "Incorrect sanitation of the 302 redirect field in HTTP transport method of apt versions 1.4.8 and earlier can lead to content injection by a MITM attacker, potentially leading to remote code execution on the target machine.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3462"
        ]
      },
      {
        "id": "CVE-2017-2626",
        "package": "libice",
        "version": "2:1.0.9-1",
        "fix_version": "2:1.0.9-1+deb8u1",
        "severity": "Low",
        "description": "It was discovered that libICE before 1.0.9-8 used a weak entropy to generate keys. A local attacker could potentially use this flaw for session hijacking using the information available from the process list.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-2626"
        ]
      },
      {
        "id": "CVE-2013-7040",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Python 2.7 before 3.4 only uses the last eight bits of the prefix to randomize hash values, which causes it to compute hash values without restricting the ability to trigger hash collisions predictably and makes it easier for context-dependent attackers to cause a denial of service (CPU consumption) via crafted input to an application that maintains a hash table.  NOTE: this vulnerability exists because of an incomplete fix for CVE-2012-1150.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2013-7040"
        ]
      },
      {
        "id": "CVE-2017-17522",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "** DISPUTED ** Lib/webbrowser.py in Python through 3.6.3 does not validate strings before launching the program specified by the BROWSER environment variable, which might allow remote attackers to conduct argument-injection attacks via a crafted URL. NOTE: a software maintainer indicates that exploitation is impossible because the code relies on subprocess.Popen and the default shell=False setting.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-17522"
        ]
      },
      {
        "id": "CVE-2017-1000158",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u2",
        "severity": "High",
        "description": "CPython (aka Python) up to 2.7.13 is vulnerable to an integer overflow in the PyString_DecodeEscape function in stringobject.c, resulting in heap-based buffer overflow (and possible arbitrary code execution)",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000158"
        ]
      },
      {
        "id": "CVE-2016-1000110",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The CGIHandler class in Python before 2.7.12 does not protect against the HTTP_PROXY variable name clash in a CGI script, which could allow a remote attacker to redirect HTTP requests.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-1000110"
        ]
      },
      {
        "id": "CVE-2018-20852",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u4",
        "severity": "Medium",
        "description": "http.cookiejar.DefaultPolicy.domain_return_ok in Lib/http/cookiejar.py in Python before 3.7.3 does not correctly validate the domain: it can be tricked into sending existing cookies to the wrong server. An attacker may abuse this flaw by using a server with a hostname that has another valid hostname as a suffix (e.g., pythonicexample.com to steal cookies for example.com). When a program uses http.cookiejar.DefaultPolicy and tries to do an HTTP connection to an attacker-controlled server, existing cookies can be leaked to the attacker. This affects 2.x through 2.7.16, 3.x before 3.4.10, 3.5.x before 3.5.7, 3.6.x before 3.6.9, and 3.7.x before 3.7.3.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20852"
        ]
      },
      {
        "id": "CVE-2019-18348",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "An issue was discovered in urllib2 in Python 2.x through 2.7.17 and urllib in Python 3.x through 3.8.0. CRLF injection is possible if the attacker controls a url parameter, as demonstrated by the first argument to urllib.request.urlopen with \\r\\n (specifically in the host component of a URL) followed by an HTTP header. This is similar to the CVE-2019-9740 query string issue and the CVE-2019-9947 path string issue. (This is not exploitable when glibc has CVE-2016-10739 fixed.)",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-18348"
        ]
      },
      {
        "id": "CVE-2018-1061",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u2",
        "severity": "Low",
        "description": "python before versions 2.7.15, 3.4.9, 3.5.6rc1, 3.6.5rc1 and 3.7.0 is vulnerable to catastrophic backtracking in the difflib.IS_LINE_JUNK method.  An attacker could use this flaw to cause denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1061"
        ]
      },
      {
        "id": "CVE-2019-9636",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u3",
        "severity": "Medium",
        "description": "Python 2.7.x through 2.7.16 and 3.x through 3.7.2 is affected by: Improper Handling of Unicode Encoding (with an incorrect netloc) during NFKC normalization. The impact is: Information disclosure (credentials, cookies, etc. that are cached against a given hostname). The components are: urllib.parse.urlsplit, urllib.parse.urlparse. The attack vector is: A specially crafted URL could be incorrectly parsed to locate cookies or authentication data and send that information to a different host than when parsed correctly.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-9636"
        ]
      },
      {
        "id": "CVE-2019-16935",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "",
        "severity": "Low",
        "description": "The documentation XML-RPC server in Python through 2.7.16, 3.x through 3.6.9, and 3.7.x through 3.7.4 has XSS via the server_title field. This occurs in Lib/DocXMLRPCServer.py in Python 2.x, and in Lib/xmlrpc/server.py in Python 3.x. If set_server_title is called with untrusted input, arbitrary JavaScript can be delivered to clients that visit the http URL for this server.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-16935"
        ]
      },
      {
        "id": "CVE-2019-16056",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u5",
        "severity": "Medium",
        "description": "An issue was discovered in Python through 2.7.16, 3.x through 3.5.7, 3.6.x through 3.6.9, and 3.7.x through 3.7.4. The email module wrongly parses email addresses that contain multiple @ characters. An application that uses the email module and implements some kind of checks on the From/To headers of a message could be tricked into accepting an email address that should be denied. An attack may be the same as in CVE-2019-11340; however, this CVE applies to Python more generally.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-16056"
        ]
      },
      {
        "id": "CVE-2019-9947",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u3",
        "severity": "Medium",
        "description": "An issue was discovered in urllib2 in Python 2.x through 2.7.16 and urllib in Python 3.x through 3.7.3. CRLF injection is possible if the attacker controls a url parameter, as demonstrated by the first argument to urllib.request.urlopen with \\r\\n (specifically in the path component of a URL that lacks a ? character) followed by an HTTP header or a Redis command. This is similar to the CVE-2019-9740 query string issue.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-9947"
        ]
      },
      {
        "id": "CVE-2019-9740",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u3",
        "severity": "Medium",
        "description": "An issue was discovered in urllib2 in Python 2.x through 2.7.16 and urllib in Python 3.x through 3.7.3. CRLF injection is possible if the attacker controls a url parameter, as demonstrated by the first argument to urllib.request.urlopen with \\r\\n (specifically in the query string after a ? character) followed by an HTTP header or a Redis command.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-9740"
        ]
      },
      {
        "id": "CVE-2019-5010",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u3",
        "severity": "Medium",
        "description": "An exploitable denial-of-service vulnerability exists in the X509 certificate parser of Python.org Python 2.7.11 / 3.6.6. A specially crafted X509 certificate can cause a NULL pointer dereference, resulting in a denial of service. An attacker can initiate or accept TLS connections using crafted certificates to trigger this vulnerability.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-5010"
        ]
      },
      {
        "id": "CVE-2018-14647",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u3",
        "severity": "Medium",
        "description": "Python's elementtree C accelerator failed to initialise Expat's hash salt during initialization. This could make it easy to conduct denial of service attacks against Expat by constructing an XML document that would cause pathological hash collisions in Expat's internal data structures, consuming large amounts CPU and RAM. Python 3.8, 3.7, 3.6, 3.5, 3.4, 2.7 are believed to be vulnerable.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-14647"
        ]
      },
      {
        "id": "CVE-2019-9948",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u3",
        "severity": "Medium",
        "description": "urllib in Python 2.x through 2.7.16 supports the local_file: scheme, which makes it easier for remote attackers to bypass protection mechanisms that blacklist file: URIs, as demonstrated by triggering a urllib.urlopen('local_file:///etc/passwd') call.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-9948"
        ]
      },
      {
        "id": "CVE-2018-1060",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u2",
        "severity": "Low",
        "description": "python before versions 2.7.15, 3.4.9, 3.5.6rc1, 3.6.5rc1 and 3.7.0 is vulnerable to catastrophic backtracking in pop3lib's apop() method. An attacker could use this flaw to cause denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1060"
        ]
      },
      {
        "id": "CVE-2019-9674",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Lib/zipfile.py in Python through 3.7.2 allows remote attackers to cause a denial of service (resource consumption) via a ZIP bomb.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-9674"
        ]
      },
      {
        "id": "CVE-2018-1000802",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "2.7.9-2+deb8u2",
        "severity": "Negligible",
        "description": "Python Software Foundation Python (CPython) version 2.7 contains a CWE-77: Improper Neutralization of Special Elements used in a Command ('Command Injection') vulnerability in shutil module (make_archive function) that can result in Denial of service, Information gain via injection of arbitrary files on the system or entire drive. This attack appear to be exploitable via Passage of unfiltered user input to the function. This vulnerability appears to have been fixed in after commit add531a1e55b0a739b0f42582f1c9747e5649ace.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000802"
        ]
      },
      {
        "id": "CVE-2020-8492",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "",
        "severity": "High",
        "description": "Python 2.7 through 2.7.17, 3.5 through 3.5.9, 3.6 through 3.6.10, 3.7 through 3.7.6, and 3.8 through 3.8.1 allows an HTTP server to conduct Regular Expression Denial of Service (ReDoS) attacks against a client because of urllib.request.AbstractBasicAuthHandler catastrophic backtracking.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2020-8492"
        ]
      },
      {
        "id": "CVE-2018-1000030",
        "package": "python2.7",
        "version": "2.7.9-2+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Python 2.7.14 is vulnerable to a Heap-Buffer-Overflow as well as a Heap-Use-After-Free. Python versions prior to 2.7.14 may also be vulnerable and it appears that Python 2.7.17 and prior may also be vulnerable however this has not been confirmed. The vulnerability lies when multiply threads are handling large amounts of data. In both cases there is essentially a race condition that occurs. For the Heap-Buffer-Overflow, Thread 2 is creating the size for a buffer, but Thread1 is already writing to the buffer without knowing how much to write. So when a large amount of data is being processed, it is very easy to cause memory corruption using a Heap-Buffer-Overflow. As for the Use-After-Free, Thread3-\u003eMalloc-\u003eThread1-\u003eFree's-\u003eThread2-Re-uses-Free'd Memory. The PSRT has stated that this is not a security vulnerability due to the fact that the attacker must be able to run code, however in some situations, such as function as a service, this vulnerability can potentially be used by an attacker to violate a trust boundary, as such the DWF feels this issue deserves a CVE.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000030"
        ]
      },
      {
        "id": "CVE-2017-12613",
        "package": "apr",
        "version": "1.5.1-3",
        "fix_version": "",
        "severity": "Low",
        "description": "When apr_time_exp*() or apr_os_exp_time*() functions are invoked with an invalid month field value in Apache Portable Runtime APR 1.6.2 and prior, out of bounds memory may be accessed in converting this value to an apr_time_exp_t value, potentially revealing the contents of a different static heap value or resulting in program termination, and may represent an information disclosure or denial of service vulnerability to applications which call these APR functions with unvalidated external input.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-12613"
        ]
      },
      {
        "id": "CVE-2015-9383",
        "package": "freetype",
        "version": "2.5.2-3+deb8u1",
        "fix_version": "2.5.2-3+deb8u4",
        "severity": "Medium",
        "description": "FreeType before 2.6.2 has a heap-based buffer over-read in tt_cmap14_validate in sfnt/ttcmap.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-9383"
        ]
      },
      {
        "id": "CVE-2017-8287",
        "package": "freetype",
        "version": "2.5.2-3+deb8u1",
        "fix_version": "2.5.2-3+deb8u2",
        "severity": "High",
        "description": "FreeType 2 before 2017-03-26 has an out-of-bounds write caused by a heap-based buffer overflow related to the t1_builder_close_contour function in psaux/psobjs.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-8287"
        ]
      },
      {
        "id": "CVE-2017-8105",
        "package": "freetype",
        "version": "2.5.2-3+deb8u1",
        "fix_version": "2.5.2-3+deb8u2",
        "severity": "High",
        "description": "FreeType 2 before 2017-03-24 has an out-of-bounds write caused by a heap-based buffer overflow related to the t1_decoder_parse_charstrings function in psaux/t1decode.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-8105"
        ]
      },
      {
        "id": "CVE-2015-9290",
        "package": "freetype",
        "version": "2.5.2-3+deb8u1",
        "fix_version": "2.5.2-3+deb8u3",
        "severity": "High",
        "description": "In FreeType before 2.6.1, a buffer over-read occurs in type1/t1parse.c on function T1_Get_Private_Dict where there is no check that the new values of cur and limit are sensible before going to Again.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-9290"
        ]
      },
      {
        "id": "CVE-2015-9382",
        "package": "freetype",
        "version": "2.5.2-3+deb8u1",
        "fix_version": "2.5.2-3+deb8u4",
        "severity": "Medium",
        "description": "FreeType before 2.6.1 has a buffer over-read in skip_comment in psaux/psobjs.c because ps_parser_skip_PS_token is mishandled in an FT_New_Memory_Face operation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-9382"
        ]
      },
      {
        "id": "CVE-2016-10244",
        "package": "freetype",
        "version": "2.5.2-3+deb8u1",
        "fix_version": "2.5.2-3+deb8u2",
        "severity": "Medium",
        "description": "The parse_charstrings function in type1/t1load.c in FreeType 2 before 2.7 does not ensure that a font contains a glyph name, which allows remote attackers to cause a denial of service (heap-based buffer over-read) or possibly have unspecified other impact via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10244"
        ]
      },
      {
        "id": "CVE-2015-9381",
        "package": "freetype",
        "version": "2.5.2-3+deb8u1",
        "fix_version": "2.5.2-3+deb8u4",
        "severity": "Medium",
        "description": "FreeType before 2.6.1 has a heap-based buffer over-read in T1_Get_Private_Dict in type1/t1parse.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-9381"
        ]
      },
      {
        "id": "CVE-2017-6512",
        "package": "perl",
        "version": "5.20.2-3+deb8u6",
        "fix_version": "5.20.2-3+deb8u7",
        "severity": "Medium",
        "description": "Race condition in the rmtree and remove_tree functions in the File-Path module before 2.13 for Perl allows attackers to set the mode on arbitrary files via vectors involving directory-permission loosening logic.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6512"
        ]
      },
      {
        "id": "CVE-2018-6797",
        "package": "perl",
        "version": "5.20.2-3+deb8u6",
        "fix_version": "",
        "severity": "High",
        "description": "An issue was discovered in Perl 5.18 through 5.26. A crafted regular expression can cause a heap-based buffer overflow, with control over the bytes written.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-6797"
        ]
      },
      {
        "id": "CVE-2018-6913",
        "package": "perl",
        "version": "5.20.2-3+deb8u6",
        "fix_version": "5.20.2-3+deb8u10",
        "severity": "High",
        "description": "Heap-based buffer overflow in the pack function in Perl before 5.26.2 allows context-dependent attackers to execute arbitrary code via a large item count.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-6913"
        ]
      },
      {
        "id": "CVE-2018-12015",
        "package": "perl",
        "version": "5.20.2-3+deb8u6",
        "fix_version": "5.20.2-3+deb8u11",
        "severity": "Medium",
        "description": "In Perl through 5.26.2, the Archive::Tar module allows remote attackers to bypass a directory-traversal protection mechanism, and overwrite arbitrary files, via an archive file containing a symlink and a regular file with the same name.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-12015"
        ]
      },
      {
        "id": "CVE-2017-12883",
        "package": "perl",
        "version": "5.20.2-3+deb8u6",
        "fix_version": "5.20.2-3+deb8u9",
        "severity": "Medium",
        "description": "Buffer overflow in the S_grok_bslash_N function in regcomp.c in Perl 5 before 5.24.3-RC1 and 5.26.x before 5.26.1-RC1 allows remote attackers to disclose sensitive information or cause a denial of service (application crash) via a crafted regular expression with an invalid '\\N{U+...}' escape.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-12883"
        ]
      },
      {
        "id": "CVE-2017-12837",
        "package": "perl",
        "version": "5.20.2-3+deb8u6",
        "fix_version": "5.20.2-3+deb8u9",
        "severity": "Medium",
        "description": "Heap-based buffer overflow in the S_regatom function in regcomp.c in Perl 5 before 5.24.3-RC1 and 5.26.x before 5.26.1-RC1 allows remote attackers to cause a denial of service (out-of-bounds write) via a regular expression with a '\\N{}' escape and the case-insensitive modifier.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-12837"
        ]
      },
      {
        "id": "CVE-2018-18311",
        "package": "perl",
        "version": "5.20.2-3+deb8u6",
        "fix_version": "5.20.2-3+deb8u12",
        "severity": "High",
        "description": "Perl before 5.26.3 and 5.28.x before 5.28.1 has a buffer overflow via a crafted regular expression that triggers invalid write operations.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-18311"
        ]
      },
      {
        "id": "CVE-2011-4116",
        "package": "perl",
        "version": "5.20.2-3+deb8u6",
        "fix_version": "",
        "severity": "Negligible",
        "description": "_is_safe in the File::Temp module for Perl does not properly handle symlinks.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2011-4116"
        ]
      },
      {
        "id": "CVE-2019-8675",
        "package": "cups",
        "version": "1.7.5-11+deb8u1",
        "fix_version": "1.7.5-11+deb8u5",
        "severity": "Unknown",
        "description": "",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-8675"
        ]
      },
      {
        "id": "CVE-2018-4300",
        "package": "cups",
        "version": "1.7.5-11+deb8u1",
        "fix_version": "1.7.5-11+deb8u6",
        "severity": "Medium",
        "description": "The session cookie generated by the CUPS web interface was easy to guess on Linux, allowing unauthorized scripted access to the web interface when the web interface is enabled. This issue affected versions prior to v2.2.10.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-4300"
        ]
      },
      {
        "id": "CVE-2018-4181",
        "package": "cups",
        "version": "1.7.5-11+deb8u1",
        "fix_version": "1.7.5-11+deb8u4",
        "severity": "Medium",
        "description": "In macOS High Sierra before 10.13.5, an issue existed in CUPS. This issue was addressed with improved access restrictions.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-4181"
        ]
      },
      {
        "id": "CVE-2018-6553",
        "package": "cups",
        "version": "1.7.5-11+deb8u1",
        "fix_version": "1.7.5-11+deb8u4",
        "severity": "Medium",
        "description": "The CUPS AppArmor profile incorrectly confined the dnssd backend due to use of hard links. A local attacker could possibly use this issue to escape confinement. This flaw affects versions prior to 2.2.7-1ubuntu2.1 in Ubuntu 18.04 LTS, prior to 2.2.4-7ubuntu3.1 in Ubuntu 17.10, prior to 2.1.3-4ubuntu0.5 in Ubuntu 16.04 LTS, and prior to 1.7.2-0ubuntu1.10 in Ubuntu 14.04 LTS.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-6553"
        ]
      },
      {
        "id": "CVE-2019-2180",
        "package": "cups",
        "version": "1.7.5-11+deb8u1",
        "fix_version": "1.7.5-11+deb8u5",
        "severity": "Low",
        "description": "In ippSetValueTag of ipp.c in Android 8.0, 8.1 and 9, there is a possible out of bounds read due to improper input validation. This could lead to local information disclosure from the printer service with no additional execution privileges needed. User interaction is not needed for exploitation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-2180"
        ]
      },
      {
        "id": "CVE-2017-18248",
        "package": "cups",
        "version": "1.7.5-11+deb8u1",
        "fix_version": "1.7.5-11+deb8u3",
        "severity": "Low",
        "description": "The add_job function in scheduler/ipp.c in CUPS before 2.2.6, when D-Bus support is enabled, can be crashed by remote attackers by sending print jobs with an invalid username, related to a D-Bus notification.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-18248"
        ]
      },
      {
        "id": "CVE-2017-18190",
        "package": "cups",
        "version": "1.7.5-11+deb8u1",
        "fix_version": "1.7.5-11+deb8u3",
        "severity": "Medium",
        "description": "A localhost.localdomain whitelist entry in valid_host() in scheduler/client.c in CUPS before 2.2.2 allows remote attackers to execute arbitrary IPP commands by sending POST requests to the CUPS daemon in conjunction with DNS rebinding. The localhost.localdomain name is often resolved via a DNS server (neither the OS nor the web browser is responsible for ensuring that localhost.localdomain is 127.0.0.1).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-18190"
        ]
      },
      {
        "id": "CVE-2018-4180",
        "package": "cups",
        "version": "1.7.5-11+deb8u1",
        "fix_version": "1.7.5-11+deb8u4",
        "severity": "Medium",
        "description": "In macOS High Sierra before 10.13.5, an issue existed in CUPS. This issue was addressed with improved access restrictions.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-4180"
        ]
      },
      {
        "id": "CVE-2014-8166",
        "package": "cups",
        "version": "1.7.5-11+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The browsing feature in the server in CUPS does not filter ANSI escape sequences from shared printer names, which might allow remote attackers to execute arbitrary code via a crafted printer name.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2014-8166"
        ]
      },
      {
        "id": "CVE-2019-8696",
        "package": "cups",
        "version": "1.7.5-11+deb8u1",
        "fix_version": "1.7.5-11+deb8u5",
        "severity": "Unknown",
        "description": "",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-8696"
        ]
      },
      {
        "id": "CVE-2019-2228",
        "package": "cups",
        "version": "1.7.5-11+deb8u1",
        "fix_version": "1.7.5-11+deb8u7",
        "severity": "Medium",
        "description": "In array_find of array.c, there is a possible out-of-bounds read due to an incorrect bounds check. This could lead to local information disclosure in the printer spooler with no additional execution privileges needed. User interaction is not needed for exploitation.Product: AndroidVersions: Android-8.0 Android-8.1 Android-9 Android-10Android ID: A-111210196",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-2228"
        ]
      },
      {
        "id": "CVE-2019-9923",
        "package": "tar",
        "version": "1.27.1-2+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "pax_decode_header in sparse.c in GNU Tar before 1.32 had a NULL pointer dereference when parsing certain archives that have malformed extended headers.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-9923"
        ]
      },
      {
        "id": "CVE-2005-2541",
        "package": "tar",
        "version": "1.27.1-2+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Tar 1.15.1 does not properly warn the user when extracting setuid or setgid files, which may allow local users or remote attackers to gain privileges.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2005-2541"
        ]
      },
      {
        "id": "CVE-2018-20482",
        "package": "tar",
        "version": "1.27.1-2+deb8u1",
        "fix_version": "1.27.1-2+deb8u2",
        "severity": "Low",
        "description": "GNU Tar through 1.30, when --sparse is used, mishandles file shrinkage during read access, which allows local users to cause a denial of service (infinite read loop in sparse_dump_region in sparse.c) by modifying a file that is supposed to be archived by a different user's process (e.g., a system backup running as root).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20482"
        ]
      },
      {
        "id": "CVE-2018-0495",
        "package": "libgcrypt20",
        "version": "1.6.3-2+deb8u2",
        "fix_version": "1.6.3-2+deb8u5",
        "severity": "Low",
        "description": "Libgcrypt before 1.7.10 and 1.8.x before 1.8.3 allows a memory-cache side-channel attack on ECDSA signatures that can be mitigated through the use of blinding during the signing process in the _gcry_ecc_ecdsa_sign function in cipher/ecc-ecdsa.c, aka the Return Of the Hidden Number Problem or ROHNP. To discover an ECDSA key, the attacker needs access to either the local machine or a different virtual machine on the same physical host.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-0495"
        ]
      },
      {
        "id": "CVE-2017-9526",
        "package": "libgcrypt20",
        "version": "1.6.3-2+deb8u2",
        "fix_version": "1.6.3-2+deb8u3",
        "severity": "Medium",
        "description": "In Libgcrypt before 1.7.7, an attacker who learns the EdDSA session key (from side-channel observation during the signing process) can easily recover the long-term secret key. 1.7.7 makes a cipher/ecc-eddsa.c change to store this session key in secure memory, to ensure that constant-time point operations are used in the MPI library.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9526"
        ]
      },
      {
        "id": "CVE-2017-7526",
        "package": "libgcrypt20",
        "version": "1.6.3-2+deb8u2",
        "fix_version": "1.6.3-2+deb8u4",
        "severity": "Negligible",
        "description": "libgcrypt before version 1.7.8 is vulnerable to a cache side-channel attack resulting into a complete break of RSA-1024 while using the left-to-right method for computing the sliding-window expansion. The same attack is believed to work on RSA-2048 with moderately more computation. This side-channel requires that attacker can run arbitrary software on the hardware where the private RSA key is used.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7526"
        ]
      },
      {
        "id": "CVE-2018-6829",
        "package": "libgcrypt20",
        "version": "1.6.3-2+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "cipher/elgamal.c in Libgcrypt through 1.8.2, when used to encrypt messages directly, improperly encodes plaintexts, which allows attackers to obtain sensitive information by reading ciphertext data (i.e., it does not have semantic security in face of a ciphertext-only attack). The Decisional Diffie-Hellman (DDH) assumption does not hold for Libgcrypt's ElGamal implementation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-6829"
        ]
      },
      {
        "id": "CVE-2019-13627",
        "package": "libgcrypt20",
        "version": "1.6.3-2+deb8u2",
        "fix_version": "1.6.3-2+deb8u8",
        "severity": "Medium",
        "description": "It was discovered that there was a ECDSA timing attack in the libgcrypt20 cryptographic library. Version affected: 1.8.4-5, 1.7.6-2+deb9u3, and 1.6.3-2+deb8u4. Versions fixed: 1.8.5-2 and 1.6.3-2+deb8u7.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-13627"
        ]
      },
      {
        "id": "CVE-2018-13346",
        "package": "mercurial",
        "version": "3.1.2-2+deb8u3",
        "fix_version": "3.1.2-2+deb8u5",
        "severity": "Medium",
        "description": "The mpatch_apply function in mpatch.c in Mercurial before 4.6.1 incorrectly proceeds in cases where the fragment start is past the end of the original data, aka OVE-20180430-0004.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-13346"
        ]
      },
      {
        "id": "CVE-2018-1000132",
        "package": "mercurial",
        "version": "3.1.2-2+deb8u3",
        "fix_version": "3.1.2-2+deb8u5",
        "severity": "Medium",
        "description": "Mercurial version 4.5 and earlier contains a Incorrect Access Control (CWE-285) vulnerability in Protocol server that can result in Unauthorized data access. This attack appear to be exploitable via network connectivity. This vulnerability appears to have been fixed in 4.5.1.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000132"
        ]
      },
      {
        "id": "CVE-2019-3902",
        "package": "mercurial",
        "version": "3.1.2-2+deb8u3",
        "fix_version": "3.1.2-2+deb8u7",
        "severity": "Medium",
        "description": "A flaw was found in Mercurial before 4.9. It was possible to use symlinks and subrepositories to defeat Mercurial's path-checking logic and write files outside a repository.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3902"
        ]
      },
      {
        "id": "CVE-2018-13347",
        "package": "mercurial",
        "version": "3.1.2-2+deb8u3",
        "fix_version": "3.1.2-2+deb8u5",
        "severity": "High",
        "description": "mpatch.c in Mercurial before 4.6.1 mishandles integer addition and subtraction, aka OVE-20180430-0002.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-13347"
        ]
      },
      {
        "id": "CVE-2017-1000115",
        "package": "mercurial",
        "version": "3.1.2-2+deb8u3",
        "fix_version": "3.1.2-2+deb8u4",
        "severity": "Medium",
        "description": "Mercurial prior to version 4.3 is vulnerable to a missing symlink check that can malicious repositories to modify files outside the repository",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000115"
        ]
      },
      {
        "id": "CVE-2017-1000116",
        "package": "mercurial",
        "version": "3.1.2-2+deb8u3",
        "fix_version": "3.1.2-2+deb8u4",
        "severity": "Critical",
        "description": "Mercurial prior to 4.3 did not adequately sanitize hostnames passed to ssh, leading to possible shell-injection attacks.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000116"
        ]
      },
      {
        "id": "CVE-2018-13348",
        "package": "mercurial",
        "version": "3.1.2-2+deb8u3",
        "fix_version": "3.1.2-2+deb8u5",
        "severity": "Medium",
        "description": "The mpatch_decode function in mpatch.c in Mercurial before 4.6.1 mishandles certain situations where there should be at least 12 bytes remaining after the current position in the patch data, but actually are not, aka OVE-20180430-0001.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-13348"
        ]
      },
      {
        "id": "CVE-2017-17458",
        "package": "mercurial",
        "version": "3.1.2-2+deb8u3",
        "fix_version": "3.1.2-2+deb8u6",
        "severity": "Critical",
        "description": "In Mercurial before 4.4.1, it is possible that a specially malformed repository can cause Git subrepositories to run arbitrary code in the form of a .git/hooks/post-update script checked into the repository. Typical use of Mercurial prevents construction of such repositories, but they can be created programmatically.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-17458"
        ]
      },
      {
        "id": "CVE-2017-9462",
        "package": "mercurial",
        "version": "3.1.2-2+deb8u3",
        "fix_version": "3.1.2-2+deb8u5",
        "severity": "Critical",
        "description": "In Mercurial before 4.1.3, \"hg serve --stdio\" allows remote authenticated users to launch the Python debugger, and consequently execute arbitrary code, by using --debugger as a repository name.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9462"
        ]
      },
      {
        "id": "CVE-2016-2781",
        "package": "coreutils",
        "version": "8.23-4",
        "fix_version": "",
        "severity": "Low",
        "description": "chroot in GNU coreutils, when used with --userspec, allows local users to escape to the parent session via a crafted TIOCSTI ioctl call, which pushes characters to the terminal's input buffer.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-2781"
        ]
      },
      {
        "id": "CVE-2017-18018",
        "package": "coreutils",
        "version": "8.23-4",
        "fix_version": "",
        "severity": "Negligible",
        "description": "In GNU Coreutils through 8.29, chown-core.c in chown and chgrp does not prevent replacement of a plain file with a symlink during use of the POSIX \"-R -L\" options, which allows local users to modify the ownership of arbitrary files by leveraging a race condition.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-18018"
        ]
      },
      {
        "id": "CVE-2017-11671",
        "package": "gcc-4.9",
        "version": "4.9.2-10",
        "fix_version": "",
        "severity": "Low",
        "description": "Under certain circumstances, the ix86_expand_builtin function in i386.c in GNU Compiler Collection (GCC) version 4.6, 4.7, 4.8, 4.9, 5 before 5.5, and 6 before 6.4 will generate instruction sequences that clobber the status flag of the RDRAND and RDSEED intrinsics before it can be read, potentially causing failures of these instructions to go unreported. This could potentially lead to less randomness in random number generation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11671"
        ]
      },
      {
        "id": "CVE-2018-12886",
        "package": "gcc-4.9",
        "version": "4.9.2-10",
        "fix_version": "",
        "severity": "Medium",
        "description": "stack_protect_prologue in cfgexpand.c and stack_protect_epilogue in function.c in GNU Compiler Collection (GCC) 4.1 through 8 (under certain circumstances) generate instruction sequences when targeting ARM targets that spill the address of the stack protector guard, which allows an attacker to bypass the protection of -fstack-protector, -fstack-protector-all, -fstack-protector-strong, and -fstack-protector-explicit against stack overflow by controlling what the stack canary is compared against.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-12886"
        ]
      },
      {
        "id": "CVE-2015-5276",
        "package": "gcc-4.9",
        "version": "4.9.2-10",
        "fix_version": "",
        "severity": "Medium",
        "description": "The std::random_device class in libstdc++ in the GNU Compiler Collection (aka GCC) before 4.9.4 does not properly handle short reads from blocking sources, which makes it easier for context-dependent attackers to predict the random values via unspecified vectors.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-5276"
        ]
      },
      {
        "id": "CVE-2017-12132",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Medium",
        "description": "The DNS stub resolver in the GNU C Library (aka glibc or libc6) before version 2.26, when EDNS support is enabled, will solicit large UDP responses from name servers, potentially simplifying off-path DNS spoofing attacks due to IP fragmentation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-12132"
        ]
      },
      {
        "id": "CVE-2018-11237",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Low",
        "description": "An AVX-512-optimized implementation of the mempcpy function in the GNU C Library (aka glibc or libc6) 2.27 and earlier may write data beyond the target buffer, leading to a buffer overflow in __mempcpy_avx512_no_vzeroupper.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-11237"
        ]
      },
      {
        "id": "CVE-2010-4052",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Stack consumption vulnerability in the regcomp implementation in the GNU C Library (aka glibc or libc6) through 2.11.3, and 2.12.x through 2.12.2, allows context-dependent attackers to cause a denial of service (resource exhaustion) via a regular expression containing adjacent repetition operators, as demonstrated by a {10,}{10,}{10,}{10,} sequence in the proftpd.gnu.c exploit for ProFTPD.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2010-4052"
        ]
      },
      {
        "id": "CVE-2014-9761",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "High",
        "description": "Multiple stack-based buffer overflows in the GNU C Library (aka glibc or libc6) before 2.23 allow context-dependent attackers to cause a denial of service (application crash) or possibly execute arbitrary code via a long argument to the (1) nan, (2) nanf, or (3) nanl function.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2014-9761"
        ]
      },
      {
        "id": "CVE-2009-5155",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Medium",
        "description": "In the GNU C Library (aka glibc or libc6) before 2.28, parse_reg_exp in posix/regcomp.c misparses alternatives, which allows attackers to cause a denial of service (assertion failure and application exit) or trigger an incorrect result by attempting a regular-expression match.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2009-5155"
        ]
      },
      {
        "id": "CVE-2017-16997",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Critical",
        "description": "elf/dl-load.c in the GNU C Library (aka glibc or libc6) 2.19 through 2.26 mishandles RPATH and RUNPATH containing $ORIGIN for a privileged (setuid or AT_SECURE) program, which allows local users to gain privileges via a Trojan horse library in the current working directory, related to the fillin_rpath and decompose_rpath functions. This is associated with misinterpretion of an empty RPATH/RUNPATH token as the \"./\" directory. NOTE: this configuration of RPATH/RUNPATH for a privileged program is apparently very uncommon; most likely, no such program is shipped with any common Linux distribution.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-16997"
        ]
      },
      {
        "id": "CVE-2019-1010022",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "GNU Libc current is affected by: Mitigation bypass. The impact is: Attacker may bypass stack guard protection. The component is: nptl. The attack vector is: Exploit stack buffer overflow vulnerability and use this bypass vulnerability to bypass stack guard.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1010022"
        ]
      },
      {
        "id": "CVE-2019-9169",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "High",
        "description": "In the GNU C Library (aka glibc or libc6) through 2.29, proceed_next_node in posix/regexec.c has a heap-based buffer over-read via an attempted case-insensitive regular-expression match.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-9169"
        ]
      },
      {
        "id": "CVE-2010-4756",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The glob implementation in the GNU C Library (aka glibc or libc6) allows remote authenticated users to cause a denial of service (CPU and memory consumption) via crafted glob expressions that do not match any pathnames, as demonstrated by glob expressions in STAT commands to an FTP daemon, a different vulnerability than CVE-2010-2632.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2010-4756"
        ]
      },
      {
        "id": "CVE-2018-1000001",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "High",
        "description": "In glibc 2.26 and earlier there is confusion in the usage of getcwd() by realpath() which can be used to write before the destination buffer leading to a buffer underflow and potential code execution.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000001"
        ]
      },
      {
        "id": "CVE-2019-1010024",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "GNU Libc current is affected by: Mitigation bypass. The impact is: Attacker may bypass ASLR using cache of thread stack and heap. The component is: glibc.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1010024"
        ]
      },
      {
        "id": "CVE-2016-10228",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Low",
        "description": "The iconv program in the GNU C Library (aka glibc or libc6) 2.25 and earlier, when invoked with the -c option, enters an infinite loop when processing invalid multi-byte input sequences, leading to a denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10228"
        ]
      },
      {
        "id": "CVE-2019-1010023",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "GNU Libc current is affected by: Re-mapping current loaded libray with malicious ELF file. The impact is: In worst case attacker may evaluate privileges. The component is: libld. The attack vector is: Attacker sends 2 ELF files to victim and asks to run ldd on it. ldd execute code.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1010023"
        ]
      },
      {
        "id": "CVE-2017-12133",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Medium",
        "description": "Use-after-free vulnerability in the clntudp_call function in sunrpc/clnt_udp.c in the GNU C Library (aka glibc or libc6) before 2.26 allows remote attackers to have unspecified impact via vectors related to error path.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-12133"
        ]
      },
      {
        "id": "CVE-2017-15670",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Low",
        "description": "The GNU C Library (aka glibc or libc6) before 2.27 contains an off-by-one error leading to a heap-based buffer overflow in the glob function in glob.c, related to the processing of home directories using the ~ operator followed by a long string.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-15670"
        ]
      },
      {
        "id": "CVE-2015-8985",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The pop_fail_stack function in the GNU C Library (aka glibc or libc6) allows context-dependent attackers to cause a denial of service (assertion failure and application crash) via vectors related to extended regular expression processing.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-8985"
        ]
      },
      {
        "id": "CVE-2019-9192",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "** DISPUTED ** In the GNU C Library (aka glibc or libc6) through 2.29, check_dst_limits_calc_pos_1 in posix/regexec.c has Uncontrolled Recursion, as demonstrated by '(|)(\\\\1\\\\1)*' in grep, a different issue than CVE-2018-20796. NOTE: the software maintainer disputes that this is a vulnerability because the behavior occurs only with a crafted pattern.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-9192"
        ]
      },
      {
        "id": "CVE-2017-1000408",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "High",
        "description": "A memory leak in glibc 2.1.1 (released on May 24, 1999) can be reached and amplified through the LD_HWCAP_MASK environment variable. Please note that many versions of glibc are not vulnerable to this issue if patched for CVE-2017-1000366.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000408"
        ]
      },
      {
        "id": "CVE-2017-15804",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Low",
        "description": "The glob function in glob.c in the GNU C Library (aka glibc or libc6) before 2.27 contains a buffer overflow during unescaping of user names with the ~ operator.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-15804"
        ]
      },
      {
        "id": "CVE-2019-1010025",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "** DISPUTED ** GNU Libc current is affected by: Mitigation bypass. The impact is: Attacker may guess the heap addresses of pthread_created thread. The component is: glibc. NOTE: the vendor's position is \"ASLR bypass itself is not a vulnerability.\"",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1010025"
        ]
      },
      {
        "id": "CVE-2016-10739",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Medium",
        "description": "In the GNU C Library (aka glibc or libc6) through 2.28, the getaddrinfo function would successfully parse a string that contained an IPv4 address followed by whitespace and arbitrary characters, which could lead applications to incorrectly assume that it had parsed a valid string, without the possibility of embedded HTTP headers or other potentially dangerous substrings.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10739"
        ]
      },
      {
        "id": "CVE-2018-6485",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "High",
        "description": "An integer overflow in the implementation of the posix_memalign in memalign functions in the GNU C Library (aka glibc or libc6) 2.26 and earlier could cause these functions to return a pointer to a heap area that is too small, potentially leading to heap corruption.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-6485"
        ]
      },
      {
        "id": "CVE-2019-6488",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The string component in the GNU C Library (aka glibc or libc6) through 2.28, when running on the x32 architecture, incorrectly attempts to use a 64-bit register for size_t in assembly codes, which can lead to a segmentation fault or possibly unspecified other impact, as demonstrated by a crash in __memmove_avx_unaligned_erms in sysdeps/x86_64/multiarch/memmove-vec-unaligned-erms.S during a memcpy.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-6488"
        ]
      },
      {
        "id": "CVE-2018-11236",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Low",
        "description": "stdlib/canonicalize.c in the GNU C Library (aka glibc or libc6) 2.27 and earlier, when processing very long pathname arguments to the realpath function, could encounter an integer overflow on 32-bit architectures, leading to a stack-based buffer overflow and, potentially, arbitrary code execution.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-11236"
        ]
      },
      {
        "id": "CVE-2019-7309",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "In the GNU C Library (aka glibc or libc6) through 2.29, the memcmp function for the x32 architecture can incorrectly return zero (indicating that the inputs are equal) because the RDX most significant bit is mishandled.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-7309"
        ]
      },
      {
        "id": "CVE-2017-15671",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Low",
        "description": "The glob function in glob.c in the GNU C Library (aka glibc or libc6) before 2.27, when invoked with GLOB_TILDE, could skip freeing allocated memory when processing the ~ operator with a long user name, potentially leading to a denial of service (memory leak).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-15671"
        ]
      },
      {
        "id": "CVE-2015-5180",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Low",
        "description": "res_query in libresolv in glibc before 2.25 allows remote attackers to cause a denial of service (NULL pointer dereference and process crash).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-5180"
        ]
      },
      {
        "id": "CVE-2017-1000366",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "2.19-18+deb8u10",
        "severity": "High",
        "description": "glibc contains a vulnerability that allows specially crafted LD_LIBRARY_PATH values to manipulate the heap/stack, causing them to alias, potentially resulting in arbitrary code execution. Please note that additional hardening changes have been made to glibc to prevent manipulation of stack and heap memory but these issues are not directly exploitable, as such they have not been given a CVE. This affects glibc 2.25 and earlier.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000366"
        ]
      },
      {
        "id": "CVE-2018-20796",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "In the GNU C Library (aka glibc or libc6) through 2.29, check_dst_limits_calc_pos_1 in posix/regexec.c has Uncontrolled Recursion, as demonstrated by '(\\227|)(\\\\1\\\\1|t1|\\\\\\2537)+' in grep.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20796"
        ]
      },
      {
        "id": "CVE-2017-1000409",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "High",
        "description": "A buffer overflow in glibc 2.5 (released on September 29, 2006) and can be triggered through the LD_LIBRARY_PATH environment variable. Please note that many versions of glibc are not vulnerable to this issue if patched for CVE-2017-1000366.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000409"
        ]
      },
      {
        "id": "CVE-2010-4051",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The regcomp implementation in the GNU C Library (aka glibc or libc6) through 2.11.3, and 2.12.x through 2.12.2, allows context-dependent attackers to cause a denial of service (application crash) via a regular expression containing adjacent bounded repetitions that bypass the intended RE_DUP_MAX limitation, as demonstrated by a {10,}{10,}{10,}{10,}{10,} sequence in the proftpd.gnu.c exploit for ProFTPD, related to a \"RE_DUP_MAX overflow.\"",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2010-4051"
        ]
      },
      {
        "id": "CVE-2020-1752",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Unknown",
        "description": "",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2020-1752"
        ]
      },
      {
        "id": "CVE-2020-1751",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Unknown",
        "description": "",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2020-1751"
        ]
      },
      {
        "id": "CVE-2020-10029",
        "package": "glibc",
        "version": "2.19-18+deb8u7",
        "fix_version": "",
        "severity": "Low",
        "description": "The GNU C Library (aka glibc or libc6) before 2.32 could overflow an on-stack buffer during range reduction if an input to an 80-bit long double function contains a non-canonical bit pattern, a seen when passing a 0x5d414141414141410000 value to sinl on x86 targets. This is related to sysdeps/ieee754/ldbl-96/e_rem_pio2l.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2020-10029"
        ]
      },
      {
        "id": "CVE-2016-7949",
        "package": "libxrender",
        "version": "1:0.9.8-1",
        "fix_version": "",
        "severity": "Low",
        "description": "Multiple buffer overflows in the (1) XvQueryAdaptors and (2) XvQueryEncodings functions in X.org libXrender before 0.9.10 allow remote X servers to trigger out-of-bounds write operations via vectors involving length fields.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7949"
        ]
      },
      {
        "id": "CVE-2016-7950",
        "package": "libxrender",
        "version": "1:0.9.8-1",
        "fix_version": "",
        "severity": "Low",
        "description": "The XRenderQueryFilters function in X.org libXrender before 0.9.10 allows remote X servers to trigger out-of-bounds write operations via vectors involving filter name lengths.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7950"
        ]
      },
      {
        "id": "CVE-2017-8283",
        "package": "dpkg",
        "version": "1.17.27",
        "fix_version": "",
        "severity": "Negligible",
        "description": "dpkg-source in dpkg 1.3.0 through 1.18.23 is able to use a non-GNU patch program and does not offer a protection mechanism for blank-indented diff hunks, which allows remote attackers to conduct directory traversal attacks via a crafted Debian source package, as demonstrated by use of dpkg-source on NetBSD.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-8283"
        ]
      },
      {
        "id": "CVE-2016-2090",
        "package": "libbsd",
        "version": "0.7.0-2",
        "fix_version": "0.7.0-2+deb8u1",
        "severity": "High",
        "description": "Off-by-one vulnerability in the fgetwln function in libbsd before 0.8.2 allows attackers to have unspecified impact via unknown vectors, which trigger a heap-based buffer overflow.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-2090"
        ]
      },
      {
        "id": "CVE-2019-20367",
        "package": "libbsd",
        "version": "0.7.0-2",
        "fix_version": "",
        "severity": "Medium",
        "description": "nlist.c in libbsd before 0.10.0 has an out-of-bounds read during a comparison for a symbol name from the string table (strtab).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-20367"
        ]
      },
      {
        "id": "CVE-2019-13232",
        "package": "unzip",
        "version": "6.0-16+deb8u2",
        "fix_version": "6.0-16+deb8u4",
        "severity": "Negligible",
        "description": "Info-ZIP UnZip 6.0 mishandles the overlapping of files inside a ZIP container, leading to denial of service (resource consumption), aka a \"better zip bomb\" issue.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-13232"
        ]
      },
      {
        "id": "CVE-2014-9913",
        "package": "unzip",
        "version": "6.0-16+deb8u2",
        "fix_version": "6.0-16+deb8u3",
        "severity": "Low",
        "description": "Buffer overflow in the list_files function in list.c in Info-Zip UnZip 6.0 allows remote attackers to cause a denial of service (crash) via vectors related to the compression method.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2014-9913"
        ]
      },
      {
        "id": "CVE-2016-9844",
        "package": "unzip",
        "version": "6.0-16+deb8u2",
        "fix_version": "6.0-16+deb8u3",
        "severity": "Low",
        "description": "Buffer overflow in the zi_short function in zipinfo.c in Info-Zip UnZip 6.0 allows remote attackers to cause a denial of service (crash) via a large compression method value in the central directory file header.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9844"
        ]
      },
      {
        "id": "CVE-2018-1000035",
        "package": "unzip",
        "version": "6.0-16+deb8u2",
        "fix_version": "6.0-16+deb8u6",
        "severity": "Medium",
        "description": "A heap-based buffer overflow exists in Info-Zip UnZip version \u003c= 6.00 in the processing of password-protected archives that allows an attacker to perform a denial of service or to possibly achieve code execution.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000035"
        ]
      },
      {
        "id": "CVE-2008-4108",
        "package": "python-defaults",
        "version": "2.7.9-1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Tools/faqwiz/move-faqwiz.sh (aka the generic FAQ wizard moving tool) in Python 2.4.5 might allow local users to overwrite arbitrary files via a symlink attack on a tmp$RANDOM.tmp temporary file.  NOTE: there may not be common usage scenarios in which tmp$RANDOM.tmp is located in an untrusted directory.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2008-4108"
        ]
      },
      {
        "id": "CVE-2018-7999",
        "package": "graphite2",
        "version": "1.3.6-1~deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "In libgraphite2 in graphite2 1.3.11, a NULL pointer dereference vulnerability was found in Segment.cpp during a dumbRendering operation, which may allow attackers to cause a denial of service or possibly have unspecified other impact via a crafted .ttf file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-7999"
        ]
      },
      {
        "id": "CVE-2017-7774",
        "package": "graphite2",
        "version": "1.3.6-1~deb8u1",
        "fix_version": "1.3.10-1~deb8u1",
        "severity": "Medium",
        "description": "Out-of-bounds read in Graphite2 Library in Firefox before 54 in graphite2::Silf::readGraphite function.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7774"
        ]
      },
      {
        "id": "CVE-2017-7773",
        "package": "graphite2",
        "version": "1.3.6-1~deb8u1",
        "fix_version": "1.3.10-1~deb8u1",
        "severity": "Medium",
        "description": "Heap-based Buffer Overflow write in Graphite2 library in Firefox before 54 in lz4::decompress src/Decompressor.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7773"
        ]
      },
      {
        "id": "CVE-2017-7778",
        "package": "graphite2",
        "version": "1.3.6-1~deb8u1",
        "fix_version": "1.3.10-1~deb8u1",
        "severity": "High",
        "description": "A number of security vulnerabilities in the Graphite 2 library including out-of-bounds reads, buffer overflow reads and writes, and the use of uninitialized memory. These issues were addressed in Graphite 2 version 1.3.10. This vulnerability affects Firefox \u003c 54, Firefox ESR \u003c 52.2, and Thunderbird \u003c 52.2.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7778"
        ]
      },
      {
        "id": "CVE-2017-7777",
        "package": "graphite2",
        "version": "1.3.6-1~deb8u1",
        "fix_version": "1.3.10-1~deb8u1",
        "severity": "Medium",
        "description": "Use of uninitialized memory in Graphite2 library in Firefox before 54 in graphite2::GlyphCache::Loader::read_glyph function.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7777"
        ]
      },
      {
        "id": "CVE-2017-7776",
        "package": "graphite2",
        "version": "1.3.6-1~deb8u1",
        "fix_version": "1.3.10-1~deb8u1",
        "severity": "Medium",
        "description": "Heap-based Buffer Overflow read in Graphite2 library in Firefox before 54 in graphite2::Silf::getClassGlyph.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7776"
        ]
      },
      {
        "id": "CVE-2017-7771",
        "package": "graphite2",
        "version": "1.3.6-1~deb8u1",
        "fix_version": "1.3.10-1~deb8u1",
        "severity": "Medium",
        "description": "Out-of-bounds read in Graphite2 Library in Firefox before 54 in graphite2::Pass::readPass function.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7771"
        ]
      },
      {
        "id": "CVE-2017-7772",
        "package": "graphite2",
        "version": "1.3.6-1~deb8u1",
        "fix_version": "1.3.10-1~deb8u1",
        "severity": "Medium",
        "description": "Heap-based Buffer Overflow in Graphite2 library in Firefox before 54 in lz4::decompress function.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7772"
        ]
      },
      {
        "id": "CVE-2016-7947",
        "package": "libxrandr",
        "version": "2:1.4.2-1",
        "fix_version": "2:1.4.2-1+deb8u1",
        "severity": "Low",
        "description": "Multiple integer overflows in X.org libXrandr before 1.5.1 allow remote X servers to trigger out-of-bounds write operations via a crafted response.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7947"
        ]
      },
      {
        "id": "CVE-2016-7948",
        "package": "libxrandr",
        "version": "2:1.4.2-1",
        "fix_version": "2:1.4.2-1+deb8u1",
        "severity": "Low",
        "description": "X.org libXrandr before 1.5.1 allows remote X servers to trigger out-of-bounds write operations by leveraging mishandling of reply data.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7948"
        ]
      },
      {
        "id": "CVE-2015-5186",
        "package": "audit",
        "version": "1:2.4-1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Audit before 2.4.4 in Linux does not sanitize escape characters in filenames.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-5186"
        ]
      },
      {
        "id": "CVE-2017-14062",
        "package": "libidn",
        "version": "1.29-1+deb8u2",
        "fix_version": "1.29-1+deb8u3",
        "severity": "High",
        "description": "Integer overflow in the decode_digit function in puny_decode.c in Libidn2 before 2.0.4 allows remote attackers to cause a denial of service or possibly have unspecified other impact.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14062"
        ]
      },
      {
        "id": "CVE-2018-16869",
        "package": "nettle",
        "version": "2.7.1-5+deb8u2",
        "fix_version": "",
        "severity": "Low",
        "description": "A Bleichenbacher type side-channel based padding oracle attack was found in the way nettle handles endian conversion of RSA decrypted PKCS#1 v1.5 data. An attacker who is able to run a process on the same physical core as the victim process, could use this flaw extract plaintext or in some cases downgrade any TLS connections to a vulnerable server.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16869"
        ]
      },
      {
        "id": "CVE-2019-13565",
        "package": "openldap",
        "version": "2.4.40+dfsg-1+deb8u2",
        "fix_version": "2.4.40+dfsg-1+deb8u5",
        "severity": "Low",
        "description": "An issue was discovered in OpenLDAP 2.x before 2.4.48. When using SASL authentication and session encryption, and relying on the SASL security layers in slapd access controls, it is possible to obtain access that would otherwise be denied via a simple bind for any identity covered in those ACLs. After the first SASL bind is completed, the sasl_ssf value is retained for all new non-SASL connections. Depending on the ACL configuration, this can affect different types of operations (searches, modifications, etc.). In other words, a successful authorization step completed by one user affects the authorization requirement for a different user.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-13565"
        ]
      },
      {
        "id": "CVE-2017-17740",
        "package": "openldap",
        "version": "2.4.40+dfsg-1+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "contrib/slapd-modules/nops/nops.c in OpenLDAP through 2.4.45, when both the nops module and the memberof overlay are enabled, attempts to free a buffer that was allocated on the stack, which allows remote attackers to cause a denial of service (slapd crash) via a member MODDN operation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-17740"
        ]
      },
      {
        "id": "CVE-2019-13057",
        "package": "openldap",
        "version": "2.4.40+dfsg-1+deb8u2",
        "fix_version": "2.4.40+dfsg-1+deb8u5",
        "severity": "Low",
        "description": "An issue was discovered in the server in OpenLDAP before 2.4.48. When the server administrator delegates rootDN (database admin) privileges for certain databases but wants to maintain isolation (e.g., for multi-tenant deployments), slapd does not properly stop a rootDN from requesting authorization as an identity from another database during a SASL bind or with a proxyAuthz (RFC 4370) control. (It is not a common configuration to deploy a system where the server administrator and a DB administrator enjoy different levels of trust.)",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-13057"
        ]
      },
      {
        "id": "CVE-2015-3276",
        "package": "openldap",
        "version": "2.4.40+dfsg-1+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The nss_parse_ciphers function in libraries/libldap/tls_m.c in OpenLDAP does not properly parse OpenSSL-style multi-keyword mode cipher strings, which might cause a weaker than intended cipher to be used and allow remote attackers to have unspecified impact via unknown vectors.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-3276"
        ]
      },
      {
        "id": "CVE-2017-9287",
        "package": "openldap",
        "version": "2.4.40+dfsg-1+deb8u2",
        "fix_version": "2.4.40+dfsg-1+deb8u3",
        "severity": "Medium",
        "description": "servers/slapd/back-mdb/search.c in OpenLDAP through 2.4.44 is prone to a double free vulnerability. A user with access to search the directory can crash slapd by issuing a search including the Paged Results control with a page size of 0.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9287"
        ]
      },
      {
        "id": "CVE-2017-14159",
        "package": "openldap",
        "version": "2.4.40+dfsg-1+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "slapd in OpenLDAP 2.4.45 and earlier creates a PID file after dropping privileges to a non-root account, which might allow local users to kill arbitrary processes by leveraging access to this non-root account for PID file modification before a root script executes a \"kill `cat /pathname`\" command, as demonstrated by openldap-initscript.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14159"
        ]
      },
      {
        "id": "CVE-2017-14176",
        "package": "bzr",
        "version": "2.6.0+bzr6595-6",
        "fix_version": "2.6.0+bzr6595-6+deb8u1",
        "severity": "Critical",
        "description": "Bazaar through 2.7.0, when Subprocess SSH is used, allows remote attackers to execute arbitrary commands via a bzr+ssh URL with an initial dash character in the hostname, a related issue to CVE-2017-9800, CVE-2017-12836, CVE-2017-12976, CVE-2017-16228, CVE-2017-1000116, and CVE-2017-1000117.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14176"
        ]
      },
      {
        "id": "CVE-2017-6891",
        "package": "libtasn1-6",
        "version": "4.2-3+deb8u2",
        "fix_version": "4.2-3+deb8u3",
        "severity": "Medium",
        "description": "Two errors in the \"asn1_find_node()\" function (lib/parser_aux.c) within GnuTLS libtasn1 version 4.10 can be exploited to cause a stacked-based buffer overflow by tricking a user into processing a specially crafted assignments file via the e.g. asn1Coding utility.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6891"
        ]
      },
      {
        "id": "CVE-2017-10790",
        "package": "libtasn1-6",
        "version": "4.2-3+deb8u2",
        "fix_version": "",
        "severity": "Medium",
        "description": "The _asn1_check_identifier function in GNU Libtasn1 through 4.12 causes a NULL pointer dereference and crash when reading crafted input that triggers assignment of a NULL value within an asn1_node structure. It may lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-10790"
        ]
      },
      {
        "id": "CVE-2018-1000654",
        "package": "libtasn1-6",
        "version": "4.2-3+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "GNU Libtasn1-4.13 libtasn1-4.13 version libtasn1-4.13, libtasn1-4.12 contains a DoS, specifically CPU usage will reach 100% when running asn1Paser against the POC due to an issue in _asn1_expand_object_id(p_tree), after a long time, the program will be killed. This attack appears to be exploitable via parsing a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000654"
        ]
      },
      {
        "id": "CVE-2019-19906",
        "package": "cyrus-sasl2",
        "version": "2.1.26.dfsg1-13+deb8u1",
        "fix_version": "2.1.26.dfsg1-13+deb8u2",
        "severity": "Medium",
        "description": "cyrus-sasl (aka Cyrus SASL) 2.1.27 has an out-of-bounds write leading to unauthenticated remote denial-of-service in OpenLDAP via a malformed LDAP packet. The OpenLDAP crash is ultimately caused by an off-by-one error in _sasl_add_string in common.c in cyrus-sasl.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-19906"
        ]
      },
      {
        "id": "CVE-2019-17007",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "2:3.26-1+debu8u8",
        "severity": "Unknown",
        "description": "",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-17007"
        ]
      },
      {
        "id": "CVE-2017-7502",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "2:3.26-1+debu8u2",
        "severity": "Medium",
        "description": "Null pointer dereference vulnerability in NSS since 3.24.0 was found when server receives empty SSLv2 messages resulting into denial of service by remote attacker.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7502"
        ]
      },
      {
        "id": "CVE-2017-11697",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The __hash_open function in hash.c:229 in Mozilla Network Security Services (NSS) allows context-dependent attackers to cause a denial of service (floating point exception and crash) via a crafted cert8.db file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11697"
        ]
      },
      {
        "id": "CVE-2016-9074",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "An existing mitigation of timing side-channel attacks is insufficient in some circumstances. This issue is addressed in Network Security Services (NSS) 3.26.1. This vulnerability affects Thunderbird \u003c 45.5, Firefox ESR \u003c 45.5, and Firefox \u003c 50.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9074"
        ]
      },
      {
        "id": "CVE-2019-11727",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "A vulnerability exists where it possible to force Network Security Services (NSS) to sign CertificateVerify with PKCS#1 v1.5 signatures when those are the only ones advertised by server in CertificateRequest in TLS 1.3. PKCS#1 v1.5 signatures should not be used for TLS 1.3 messages. This vulnerability affects Firefox \u003c 68.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-11727"
        ]
      },
      {
        "id": "CVE-2018-18508",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "2:3.26-1+debu8u4",
        "severity": "Unknown",
        "description": "",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-18508"
        ]
      },
      {
        "id": "CVE-2018-12384",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "",
        "severity": "Low",
        "description": "When handling a SSLv2-compatible ClientHello request, the server doesn't generate a new random value but sends an all-zero value instead. This results in full malleability of the ClientHello for SSLv2 used for TLS 1.2 in all versions prior to NSS 3.39. This does not impact TLS 1.3.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-12384"
        ]
      },
      {
        "id": "CVE-2017-5462",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "2:3.26-1+debu8u2",
        "severity": "Medium",
        "description": "A flaw in DRBG number generation within the Network Security Services (NSS) library where the internal state V does not correctly carry bits over. The NSS library has been updated to fix this issue to address this issue and Firefox ESR 52.1 has been updated with NSS version 3.28.4. This vulnerability affects Thunderbird \u003c 52.1, Firefox ESR \u003c 45.9, Firefox ESR \u003c 52.1, and Firefox \u003c 53.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5462"
        ]
      },
      {
        "id": "CVE-2017-5461",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "2:3.26-1+debu8u2",
        "severity": "High",
        "description": "Mozilla Network Security Services (NSS) before 3.21.4, 3.22.x through 3.28.x before 3.28.4, 3.29.x before 3.29.5, and 3.30.x before 3.30.1 allows remote attackers to cause a denial of service (out-of-bounds write) or possibly have unspecified other impact by leveraging incorrect base64 operations.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5461"
        ]
      },
      {
        "id": "CVE-2017-11696",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Heap-based buffer overflow in the __hash_open function in lib/dbm/src/hash.c in Mozilla Network Security Services (NSS) allows context-dependent attackers to have unspecified impact using a crafted cert8.db file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11696"
        ]
      },
      {
        "id": "CVE-2017-7805",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "2:3.26-1+debu8u3",
        "severity": "Medium",
        "description": "During TLS 1.2 exchanges, handshake hashes are generated which point to a message buffer. This saved data is used for later messages but in some cases, the handshake transcript can exceed the space available in the current buffer, causing the allocation of a new buffer. This leaves a pointer pointing to the old, freed buffer, resulting in a use-after-free when handshake hashes are then calculated afterwards. This can result in a potentially exploitable crash. This vulnerability affects Firefox \u003c 56, Firefox ESR \u003c 52.4, and Thunderbird \u003c 52.4.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7805"
        ]
      },
      {
        "id": "CVE-2019-11719",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "2:3.26-1+debu8u5",
        "severity": "Negligible",
        "description": "When importing a curve25519 private key in PKCS#8format with leading 0x00 bytes, it is possible to trigger an out-of-bounds read in the Network Security Services (NSS) library. This could lead to information disclosure. This vulnerability affects Firefox ESR \u003c 60.8, Firefox \u003c 68, and Thunderbird \u003c 60.8.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-11719"
        ]
      },
      {
        "id": "CVE-2017-11695",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Heap-based buffer overflow in the alloc_segs function in lib/dbm/src/hash.c in Mozilla Network Security Services (NSS) allows context-dependent attackers to have unspecified impact using a crafted cert8.db file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11695"
        ]
      },
      {
        "id": "CVE-2019-11729",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "2:3.26-1+debu8u5",
        "severity": "Negligible",
        "description": "Empty or malformed p256-ECDH public keys may trigger a segmentation fault due values being improperly sanitized before being copied into memory and used. This vulnerability affects Firefox ESR \u003c 60.8, Firefox \u003c 68, and Thunderbird \u003c 60.8.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-11729"
        ]
      },
      {
        "id": "CVE-2017-11698",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Heap-based buffer overflow in the __get_page function in lib/dbm/src/h_page.c in Mozilla Network Security Services (NSS) allows context-dependent attackers to have unspecified impact using a crafted cert8.db file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-11698"
        ]
      },
      {
        "id": "CVE-2018-12404",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "2:3.26-1+debu8u4",
        "severity": "Medium",
        "description": "A cached side channel attack during handshakes using RSA encryption could allow for the decryption of encrypted content. This is a variant of the Adaptive Chosen Ciphertext attack (AKA Bleichenbacher attack) and affects all NSS versions prior to NSS 3.41.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-12404"
        ]
      },
      {
        "id": "CVE-2019-17006",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "2:3.26-1+debu8u10",
        "severity": "Unknown",
        "description": "",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-17006"
        ]
      },
      {
        "id": "CVE-2019-11745",
        "package": "nss",
        "version": "2:3.26-1+debu8u1",
        "fix_version": "2:3.26-1+debu8u7",
        "severity": "Medium",
        "description": "When encrypting with a block cipher, if a call to NSC_EncryptUpdate was made with data smaller than the block size, a small out of bounds write could occur. This could have caused heap corruption and a potentially exploitable crash. This vulnerability affects Thunderbird \u003c 68.3, Firefox ESR \u003c 68.3, and Firefox \u003c 71.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-11745"
        ]
      },
      {
        "id": "CVE-2019-5827",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "",
        "severity": "Medium",
        "description": "Integer overflow in SQLite via WebSQL in Google Chrome prior to 74.0.3729.131 allowed a remote attacker to potentially exploit heap corruption via a crafted HTML page.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-5827"
        ]
      },
      {
        "id": "CVE-2017-13685",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The dump_callback function in SQLite 3.20.0 allows remote attackers to cause a denial of service (EXC_BAD_ACCESS and application crash) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13685"
        ]
      },
      {
        "id": "CVE-2019-16168",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "",
        "severity": "Medium",
        "description": "In SQLite through 3.29.0, whereLoopAddBtreeIndex in sqlite3.c can crash a browser or other application because of missing validation of a sqlite_stat1 sz field, aka a \"severe division by zero in the query planner.\"",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-16168"
        ]
      },
      {
        "id": "CVE-2019-19645",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "",
        "severity": "Low",
        "description": "alter.c in SQLite through 3.30.1 allows attackers to trigger infinite recursion via certain types of self-referential views in conjunction with ALTER TABLE statements.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-19645"
        ]
      },
      {
        "id": "CVE-2017-2520",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "3.8.7.1-1+deb8u4",
        "severity": "High",
        "description": "An issue was discovered in certain Apple products. iOS before 10.3.2 is affected. macOS before 10.12.5 is affected. tvOS before 10.2.1 is affected. watchOS before 3.2.2 is affected. The issue involves the \"SQLite\" component. It allows remote attackers to execute arbitrary code or cause a denial of service (buffer overflow and application crash) via a crafted SQL statement.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-2520"
        ]
      },
      {
        "id": "CVE-2017-2519",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "3.8.7.1-1+deb8u4",
        "severity": "High",
        "description": "An issue was discovered in certain Apple products. iOS before 10.3.2 is affected. macOS before 10.12.5 is affected. tvOS before 10.2.1 is affected. watchOS before 3.2.2 is affected. The issue involves the \"SQLite\" component. It allows remote attackers to execute arbitrary code or cause a denial of service (memory corruption and application crash) via a crafted SQL statement.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-2519"
        ]
      },
      {
        "id": "CVE-2018-20506",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "",
        "severity": "Medium",
        "description": "SQLite before 3.25.3, when the FTS3 extension is enabled, encounters an integer overflow (and resultant buffer overflow) for FTS3 queries in a \"merge\" operation that occurs after crafted changes to FTS3 shadow tables, allowing remote attackers to execute arbitrary code by leveraging the ability to run arbitrary SQL statements (such as in certain WebSQL use cases). This is a different vulnerability than CVE-2018-20346.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20506"
        ]
      },
      {
        "id": "CVE-2017-10989",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "3.8.7.1-1+deb8u4",
        "severity": "High",
        "description": "The getNodeSize function in ext/rtree/rtree.c in SQLite through 3.19.3, as used in GDAL and other products, mishandles undersized RTree blobs in a crafted database, leading to a heap-based buffer over-read or possibly unspecified other impact.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-10989"
        ]
      },
      {
        "id": "CVE-2018-8740",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "3.8.7.1-1+deb8u4",
        "severity": "Medium",
        "description": "In SQLite through 3.22.0, databases whose schema is corrupted using a CREATE TABLE AS statement could cause a NULL pointer dereference, related to build.c and prepare.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-8740"
        ]
      },
      {
        "id": "CVE-2017-2518",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "3.8.7.1-1+deb8u4",
        "severity": "High",
        "description": "An issue was discovered in certain Apple products. iOS before 10.3.2 is affected. macOS before 10.12.5 is affected. tvOS before 10.2.1 is affected. watchOS before 3.2.2 is affected. The issue involves the \"SQLite\" component. It allows remote attackers to execute arbitrary code or cause a denial of service (buffer overflow and application crash) via a crafted SQL statement.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-2518"
        ]
      },
      {
        "id": "CVE-2018-20346",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "3.8.7.1-1+deb8u3",
        "severity": "Medium",
        "description": "SQLite before 3.25.3, when the FTS3 extension is enabled, encounters an integer overflow (and resultant buffer overflow) for FTS3 queries that occur after crafted changes to FTS3 shadow tables, allowing remote attackers to execute arbitrary code by leveraging the ability to run arbitrary SQL statements (such as in certain WebSQL use cases), aka Magellan.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20346"
        ]
      },
      {
        "id": "CVE-2019-8457",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "",
        "severity": "High",
        "description": "SQLite3 from 3.6.0 to and including 3.27.2 is vulnerable to heap out-of-bound read in the rtreenode() function when handling invalid rtree tables.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-8457"
        ]
      },
      {
        "id": "CVE-2019-20218",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "",
        "severity": "Medium",
        "description": "selectExpander in select.c in SQLite 3.30.1 proceeds with WITH stack unwinding even after a parsing error.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-20218"
        ]
      },
      {
        "id": "CVE-2019-19603",
        "package": "sqlite3",
        "version": "3.8.7.1-1+deb8u2",
        "fix_version": "",
        "severity": "Medium",
        "description": "SQLite 3.30.1 mishandles certain SELECT statements with a nonexistent VIEW, leading to an application crash.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-19603"
        ]
      },
      {
        "id": "CVE-2016-6515",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "High",
        "description": "The auth_password function in auth-passwd.c in sshd in OpenSSH before 7.3 does not limit password lengths for password authentication, which allows remote attackers to cause a denial of service (crypt CPU consumption) via a long string.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-6515"
        ]
      },
      {
        "id": "CVE-2016-3115",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "Medium",
        "description": "Multiple CRLF injection vulnerabilities in session.c in sshd in OpenSSH before 7.2p2 allow remote authenticated users to bypass intended shell-command restrictions via crafted X11 forwarding data, related to the (1) do_authenticated1 and (2) session_x11_req functions.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-3115"
        ]
      },
      {
        "id": "CVE-2016-8858",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "",
        "severity": "High",
        "description": "** DISPUTED ** The kex_input_kexinit function in kex.c in OpenSSH 6.x and 7.x through 7.3 allows remote attackers to cause a denial of service (memory consumption) by sending many duplicate KEXINIT requests.  NOTE: a third party reports that \"OpenSSH upstream does not consider this as a security issue.\"",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8858"
        ]
      },
      {
        "id": "CVE-2016-1908",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "High",
        "description": "The client in OpenSSH before 7.2 mishandles failed cookie generation for untrusted X11 forwarding and relies on the local X11 server for access-control decisions, which allows remote X11 clients to trigger a fallback and obtain trusted X11 forwarding privileges by leveraging configuration issues on this X11 server, as demonstrated by lack of the SECURITY extension on this X11 server.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-1908"
        ]
      },
      {
        "id": "CVE-2008-3234",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "",
        "severity": "Negligible",
        "description": "sshd in OpenSSH 4 on Debian GNU/Linux, and the 20070303 OpenSSH snapshot, allows remote authenticated users to obtain access to arbitrary SELinux roles by appending a :/ (colon slash) sequence, followed by the role name, to the username.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2008-3234"
        ]
      },
      {
        "id": "CVE-2015-5352",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "Medium",
        "description": "The x11_open_helper function in channels.c in ssh in OpenSSH before 6.9, when ForwardX11Trusted mode is not used, lacks a check of the refusal deadline for X connections, which makes it easier for remote attackers to bypass intended access restrictions via a connection outside of the permitted time window.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-5352"
        ]
      },
      {
        "id": "CVE-2015-5600",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "High",
        "description": "The kbdint_next_device function in auth2-chall.c in sshd in OpenSSH through 6.9 does not properly restrict the processing of keyboard-interactive devices within a single connection, which makes it easier for remote attackers to conduct brute-force attacks or cause a denial of service (CPU consumption) via a long and duplicative list in the ssh -oKbdInteractiveDevices option, as demonstrated by a modified client that provides a different password for each pam element on this list.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-5600"
        ]
      },
      {
        "id": "CVE-2007-2243",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "",
        "severity": "Negligible",
        "description": "OpenSSH 4.6 and earlier, when ChallengeResponseAuthentication is enabled, allows remote attackers to determine the existence of user accounts by attempting to authenticate via S/KEY, which displays a different response if the user account exists, a similar issue to CVE-2001-1483.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2007-2243"
        ]
      },
      {
        "id": "CVE-2016-10708",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "Medium",
        "description": "sshd in OpenSSH before 7.4 allows remote attackers to cause a denial of service (NULL pointer dereference and daemon crash) via an out-of-sequence NEWKEYS message, as demonstrated by Honggfuzz, related to kex.c and packet.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10708"
        ]
      },
      {
        "id": "CVE-2007-2768",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "",
        "severity": "Negligible",
        "description": "OpenSSH, when using OPIE (One-Time Passwords in Everything) for PAM, allows remote attackers to determine the existence of certain user accounts, which displays a different response if the user account exists and is configured to use one-time passwords (OTP), a similar issue to CVE-2007-2243.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2007-2768"
        ]
      },
      {
        "id": "CVE-2018-20685",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u8",
        "severity": "Low",
        "description": "In OpenSSH 7.9, scp.c in the scp client allows remote SSH servers to bypass intended access restrictions via the filename of . or an empty filename. The impact is modifying the permissions of the target directory on the client side.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20685"
        ]
      },
      {
        "id": "CVE-2016-10010",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "",
        "severity": "Negligible",
        "description": "sshd in OpenSSH before 7.4, when privilege separation is not used, creates forwarded Unix-domain sockets as root, which might allow local users to gain privileges via unspecified vectors, related to serverloop.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10010"
        ]
      },
      {
        "id": "CVE-2018-15919",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "",
        "severity": "Low",
        "description": "Remotely observable behaviour in auth-gss2.c in OpenSSH through 7.8 could be used by remote attackers to detect existence of users on a target system when GSS2 is in use. NOTE: the discoverer states 'We understand that the OpenSSH developers do not want to treat such a username enumeration (or \"oracle\") as a vulnerability.'",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-15919"
        ]
      },
      {
        "id": "CVE-2015-6563",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "Low",
        "description": "The monitor component in sshd in OpenSSH before 7.0 on non-OpenBSD platforms accepts extraneous username data in MONITOR_REQ_PAM_INIT_CTX requests, which allows local users to conduct impersonation attacks by leveraging any SSH login access in conjunction with control of the sshd uid to send a crafted MONITOR_REQ_PWNAM request, related to monitor.c and monitor_wrap.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-6563"
        ]
      },
      {
        "id": "CVE-2019-6110",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "",
        "severity": "Negligible",
        "description": "In OpenSSH 7.9, due to accepting and displaying arbitrary stderr output from the server, a malicious server (or Man-in-The-Middle attacker) can manipulate the client output, for example to use ANSI control codes to hide additional files being transferred.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-6110"
        ]
      },
      {
        "id": "CVE-2016-10012",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "Low",
        "description": "The shared memory manager (associated with pre-authentication compression) in sshd in OpenSSH before 7.4 does not ensure that a bounds check is enforced by all compilers, which might allows local users to gain privileges by leveraging access to a sandboxed privilege-separation process, related to the m_zback and m_zlib data structures.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10012"
        ]
      },
      {
        "id": "CVE-2018-15473",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u5",
        "severity": "Medium",
        "description": "OpenSSH through 7.7 is prone to a user enumeration vulnerability due to not delaying bailout for an invalid authenticating user until after the packet containing the request has been fully parsed, related to auth2-gss.c, auth2-hostbased.c, and auth2-pubkey.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-15473"
        ]
      },
      {
        "id": "CVE-2016-10011",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "Low",
        "description": "authfile.c in sshd in OpenSSH before 7.4 does not properly consider the effects of realloc on buffer contents, which might allow local users to obtain sensitive private-key information by leveraging access to a privilege-separated child process.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10011"
        ]
      },
      {
        "id": "CVE-2019-6111",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u8",
        "severity": "Medium",
        "description": "An issue was discovered in OpenSSH 7.9. Due to the scp implementation being derived from 1983 rcp, the server chooses which files/directories are sent to the client. However, the scp client only performs cursory validation of the object name returned (only directory traversal attacks are prevented). A malicious scp server (or Man-in-The-Middle attacker) can overwrite arbitrary files in the scp client target directory. If recursive operation (-r) is performed, the server can manipulate subdirectories as well (for example, to overwrite the .ssh/authorized_keys file).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-6111"
        ]
      },
      {
        "id": "CVE-2015-6564",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "High",
        "description": "Use-after-free vulnerability in the mm_answer_pam_free_ctx function in monitor.c in sshd in OpenSSH before 7.0 on non-OpenBSD platforms might allow local users to gain privileges by leveraging control of the sshd uid to send an unexpectedly early MONITOR_REQ_PAM_FREE_CTX request.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-6564"
        ]
      },
      {
        "id": "CVE-2016-10009",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "Low",
        "description": "Untrusted search path vulnerability in ssh-agent.c in ssh-agent in OpenSSH before 7.4 allows remote attackers to execute arbitrary local PKCS#11 modules by leveraging control over a forwarded agent-socket.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10009"
        ]
      },
      {
        "id": "CVE-2019-6109",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u8",
        "severity": "Medium",
        "description": "An issue was discovered in OpenSSH 7.9. Due to missing character encoding in the progress display, a malicious server (or Man-in-The-Middle attacker) can employ crafted object names to manipulate the client output, e.g., by using ANSI control codes to hide additional files being transferred. This affects refresh_progress_meter() in progressmeter.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-6109"
        ]
      },
      {
        "id": "CVE-2017-15906",
        "package": "openssh",
        "version": "1:6.7p1-5+deb8u3",
        "fix_version": "1:6.7p1-5+deb8u6",
        "severity": "Low",
        "description": "The process_open function in sftp-server.c in OpenSSH before 7.6 does not properly prevent write operations in readonly mode, which allows attackers to create zero-length files.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-15906"
        ]
      },
      {
        "id": "CVE-2017-7610",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Medium",
        "description": "The check_group function in elflint.c in elfutils 0.168 allows remote attackers to cause a denial of service (heap-based buffer over-read and application crash) via a crafted ELF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7610"
        ]
      },
      {
        "id": "CVE-2017-7608",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Medium",
        "description": "The ebl_object_note_type_name function in eblobjnotetypename.c in elfutils 0.168 allows remote attackers to cause a denial of service (heap-based buffer over-read and application crash) via a crafted ELF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7608"
        ]
      },
      {
        "id": "CVE-2019-7150",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Low",
        "description": "An issue was discovered in elfutils 0.175. A segmentation fault can occur in the function elf64_xlatetom in libelf/elf32_xlatetom.c, due to dwfl_segment_report_module not checking whether the dyn data read from a core file is truncated. A crafted input can cause a program crash, leading to denial-of-service, as demonstrated by eu-stack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-7150"
        ]
      },
      {
        "id": "CVE-2016-10254",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "",
        "severity": "Low",
        "description": "The allocate_elf function in common.h in elfutils before 0.168 allows remote attackers to cause a denial of service (crash) via a crafted ELF file, which triggers a memory allocation failure.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10254"
        ]
      },
      {
        "id": "CVE-2017-7612",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Medium",
        "description": "The check_sysv_hash function in elflint.c in elfutils 0.168 allows remote attackers to cause a denial of service (heap-based buffer over-read and application crash) via a crafted ELF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7612"
        ]
      },
      {
        "id": "CVE-2018-18520",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Low",
        "description": "An Invalid Memory Address Dereference exists in the function elf_end in libelf in elfutils through v0.174. Although eu-size is intended to support ar files inside ar files, handle_ar in size.c closes the outer ar file before handling all inner entries. The vulnerability allows attackers to cause a denial of service (application crash) with a crafted ELF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-18520"
        ]
      },
      {
        "id": "CVE-2018-18521",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Low",
        "description": "Divide-by-zero vulnerabilities in the function arlib_add_symbols() in arlib.c in elfutils 0.174 allow remote attackers to cause a denial of service (application crash) with a crafted ELF file, as demonstrated by eu-ranlib, because a zero sh_entsize is mishandled.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-18521"
        ]
      },
      {
        "id": "CVE-2016-10255",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "",
        "severity": "Low",
        "description": "The __libelf_set_rawdata_wrlock function in elf_getdata.c in elfutils before 0.168 allows remote attackers to cause a denial of service (crash) via a crafted (1) sh_off or (2) sh_size ELF header value, which triggers a memory allocation failure.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10255"
        ]
      },
      {
        "id": "CVE-2018-16403",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "",
        "severity": "Low",
        "description": "libdw in elfutils 0.173 checks the end of the attributes list incorrectly in dwarf_getabbrev in dwarf_getabbrev.c and dwarf_hasattr in dwarf_hasattr.c, leading to a heap-based buffer over-read and an application crash.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16403"
        ]
      },
      {
        "id": "CVE-2017-7613",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Medium",
        "description": "elflint.c in elfutils 0.168 does not validate the number of sections and the number of segments, which allows remote attackers to cause a denial of service (memory consumption) via a crafted ELF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7613"
        ]
      },
      {
        "id": "CVE-2018-16062",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Medium",
        "description": "dwarf_getaranges in dwarf_getaranges.c in libdw in elfutils before 2018-08-18 allows remote attackers to cause a denial of service (heap-based buffer over-read) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16062"
        ]
      },
      {
        "id": "CVE-2019-7665",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Low",
        "description": "In elfutils 0.175, a heap-based buffer over-read was discovered in the function elf32_xlatetom in elf32_xlatetom.c in libelf. A crafted ELF input can cause a segmentation fault leading to denial of service (program crash) because ebl_core_note does not reject malformed core file notes.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-7665"
        ]
      },
      {
        "id": "CVE-2017-7611",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Medium",
        "description": "The check_symtab_shndx function in elflint.c in elfutils 0.168 allows remote attackers to cause a denial of service (heap-based buffer over-read and application crash) via a crafted ELF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7611"
        ]
      },
      {
        "id": "CVE-2019-7149",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Low",
        "description": "A heap-based buffer over-read was discovered in the function read_srclines in dwarf_getsrclines.c in libdw in elfutils 0.175. A crafted input can cause segmentation faults, leading to denial-of-service, as demonstrated by eu-nm.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-7149"
        ]
      },
      {
        "id": "CVE-2018-18310",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "0.159-4.2+deb8u1",
        "severity": "Medium",
        "description": "An invalid memory address dereference was discovered in dwfl_segment_report_module.c in libdwfl in elfutils through v0.174. The vulnerability allows attackers to cause a denial of service (application crash) with a crafted ELF file, as demonstrated by consider_notes.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-18310"
        ]
      },
      {
        "id": "CVE-2019-7148",
        "package": "elfutils",
        "version": "0.159-4.2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "**DISPUTED** An attempted excessive memory allocation was discovered in the function read_long_names in elf_begin.c in libelf in elfutils 0.174. Remote attackers could leverage this vulnerability to cause a denial-of-service via crafted elf input, which leads to an out-of-memory exception. NOTE: The maintainers believe this is not a real issue, but instead a \"warning caused by ASAN because the allocation is big. By setting ASAN_OPTIONS=allocator_may_return_null=1 and running the reproducer, nothing happens.\"",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-7148"
        ]
      },
      {
        "id": "CVE-2019-12749",
        "package": "dbus",
        "version": "1.8.22-0+deb8u1",
        "fix_version": "1.8.22-0+deb8u2",
        "severity": "Low",
        "description": "dbus before 1.10.28, 1.12.x before 1.12.16, and 1.13.x before 1.13.12, as used in DBusServer in Canonical Upstart in Ubuntu 14.04 (and in some, less common, uses of dbus-daemon), allows cookie spoofing because of symlink mishandling in the reference implementation of DBUS_COOKIE_SHA1 in the libdbus library. (This only affects the DBUS_COOKIE_SHA1 authentication mechanism.) A malicious client with write access to its own home directory could manipulate a ~/.dbus-keyrings symlink to cause a DBusServer with a different uid to read and write in unintended locations. In the worst case, this could result in the DBusServer reusing a cookie that is known to the malicious client, and treating that cookie as evidence that a subsequent client connection came from an attacker-chosen uid, allowing authentication bypass.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-12749"
        ]
      },
      {
        "id": "CVE-2018-1122",
        "package": "procps",
        "version": "2:3.3.9-9",
        "fix_version": "2:3.3.9-9+deb8u1",
        "severity": "Medium",
        "description": "procps-ng before version 3.3.15 is vulnerable to a local privilege escalation in top. If a user runs top with HOME unset in an attacker-controlled directory, the attacker could achieve privilege escalation by exploiting one of several vulnerabilities in the config_file() function.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1122"
        ]
      },
      {
        "id": "CVE-2018-1125",
        "package": "procps",
        "version": "2:3.3.9-9",
        "fix_version": "2:3.3.9-9+deb8u1",
        "severity": "Medium",
        "description": "procps-ng before version 3.3.15 is vulnerable to a stack buffer overflow in pgrep. This vulnerability is mitigated by FORTIFY, as it involves strncat() to a stack-allocated string. When pgrep is compiled with FORTIFY (as on Red Hat Enterprise Linux and Fedora), the impact is limited to a crash.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1125"
        ]
      },
      {
        "id": "CVE-2018-1123",
        "package": "procps",
        "version": "2:3.3.9-9",
        "fix_version": "2:3.3.9-9+deb8u1",
        "severity": "Medium",
        "description": "procps-ng before version 3.3.15 is vulnerable to a denial of service in ps via mmap buffer overflow. Inbuilt protection in ps maps a guard page at the end of the overflowed buffer, ensuring that the impact of this flaw is limited to a crash (temporary denial of service).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1123"
        ]
      },
      {
        "id": "CVE-2018-1124",
        "package": "procps",
        "version": "2:3.3.9-9",
        "fix_version": "2:3.3.9-9+deb8u1",
        "severity": "Medium",
        "description": "procps-ng before version 3.3.15 is vulnerable to multiple integer overflows leading to a heap corruption in file2strvec function. This allows a privilege escalation for a local attacker who can create entries in procfs by starting processes, which could result in crashes or arbitrary code execution in proc utilities run by other users.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1124"
        ]
      },
      {
        "id": "CVE-2018-1126",
        "package": "procps",
        "version": "2:3.3.9-9",
        "fix_version": "2:3.3.9-9+deb8u1",
        "severity": "High",
        "description": "procps-ng before version 3.3.15 is vulnerable to an incorrect integer size in proc/alloc.* leading to truncation/integer overflow issues. This flaw is related to CVE-2018-1124.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1126"
        ]
      },
      {
        "id": "CVE-2018-19543",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "An issue was discovered in JasPer 2.0.14. There is a heap-based buffer over-read of size 8 in the function jp2_decode in libjasper/jp2/jp2_dec.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19543"
        ]
      },
      {
        "id": "CVE-2016-9391",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jpc_bitstream_getbits function in jpc_bs.c in JasPer before 2.0.10 allows remote attackers to cause a denial of service (assertion failure) via a very large integer.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9391"
        ]
      },
      {
        "id": "CVE-2015-5221",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u4",
        "severity": "Medium",
        "description": "Use-after-free vulnerability in the mif_process_cmpt function in libjasper/mif/mif_cod.c in the JasPer JPEG-2000 library before 1.900.2 allows remote attackers to cause a denial of service (crash) via a crafted JPEG 2000 image file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-5221"
        ]
      },
      {
        "id": "CVE-2018-19539",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u5",
        "severity": "Medium",
        "description": "An issue was discovered in JasPer 2.0.14. There is an access violation in the function jas_image_readcmpt in libjasper/base/jas_image.c, leading to a denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19539"
        ]
      },
      {
        "id": "CVE-2017-14132",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u4",
        "severity": "Medium",
        "description": "JasPer 2.0.13 allows remote attackers to cause a denial of service (heap-based buffer over-read and application crash) via a crafted image, related to the jas_image_ishomosamp function in libjasper/base/jas_image.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14132"
        ]
      },
      {
        "id": "CVE-2016-1867",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u2",
        "severity": "Medium",
        "description": "The jpc_pi_nextcprl function in JasPer 1.900.1 allows remote attackers to cause a denial of service (out-of-bounds read and application crash) via a crafted JPEG 2000 image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-1867"
        ]
      },
      {
        "id": "CVE-2016-8693",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u2",
        "severity": "Medium",
        "description": "Double free vulnerability in the mem_close function in jas_stream.c in JasPer before 1.900.10 allows remote attackers to cause a denial of service (crash) or possibly execute arbitrary code via a crafted BMP image to the imginfo command.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8693"
        ]
      },
      {
        "id": "CVE-2016-9591",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u3",
        "severity": "Medium",
        "description": "JasPer before version 2.0.12 is vulnerable to a use-after-free in the way it decodes certain JPEG 2000 image files resulting in a crash on the application using JasPer.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9591"
        ]
      },
      {
        "id": "CVE-2017-5499",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Integer overflow in libjasper/jpc/jpc_dec.c in JasPer 1.900.17 allows remote attackers to cause a denial of service (crash) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5499"
        ]
      },
      {
        "id": "CVE-2017-13751",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "There is a reachable assertion abort in the function calcstepsizes() in jpc/jpc_dec.c in JasPer 2.0.12 that will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13751"
        ]
      },
      {
        "id": "CVE-2017-5502",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "libjasper/jp2/jp2_dec.c in JasPer 1.900.17 allows remote attackers to cause a denial of service (crash) via vectors involving left shift of a negative value.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5502"
        ]
      },
      {
        "id": "CVE-2017-5504",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jpc_undo_roi function in libjasper/jpc/jpc_dec.c in JasPer 1.900.27 allows remote attackers to cause a denial of service (invalid memory read and crash) via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5504"
        ]
      },
      {
        "id": "CVE-2016-8886",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Low",
        "description": "The jas_malloc function in libjasper/base/jas_malloc.c in JasPer before 1.900.11 allows remote attackers to have unspecified impact via a crafted file, which triggers a memory allocation failure.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8886"
        ]
      },
      {
        "id": "CVE-2017-5501",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Integer overflow in libjasper/jpc/jpc_tsfb.c in JasPer 1.900.17 allows remote attackers to cause a denial of service (crash) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5501"
        ]
      },
      {
        "id": "CVE-2017-13747",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "There is a reachable assertion abort in the function jpc_floorlog2() in jpc/jpc_math.c in JasPer 2.0.12 that will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13747"
        ]
      },
      {
        "id": "CVE-2016-9394",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jas_seq2d_create function in jas_seq.c in JasPer before 1.900.17 allows remote attackers to cause a denial of service (assertion failure) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9394"
        ]
      },
      {
        "id": "CVE-2016-8692",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u2",
        "severity": "Medium",
        "description": "The jpc_dec_process_siz function in libjasper/jpc/jpc_dec.c in JasPer before 1.900.4 allows remote attackers to cause a denial of service (divide-by-zero error and application crash) via a crafted YRsiz value in a BMP image to the imginfo command.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8692"
        ]
      },
      {
        "id": "CVE-2016-9600",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "JasPer before version 2.0.10 is vulnerable to a null pointer dereference was found in the decoded creation of JPEG 2000 image files. A specially crafted file could cause an application using JasPer to crash.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9600"
        ]
      },
      {
        "id": "CVE-2016-8690",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u4",
        "severity": "Medium",
        "description": "The bmp_getdata function in libjasper/bmp/bmp_dec.c in JasPer before 1.900.5 allows remote attackers to cause a denial of service (NULL pointer dereference) via a crafted BMP image in an imginfo command.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8690"
        ]
      },
      {
        "id": "CVE-2016-9388",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The ras_getcmap function in ras_dec.c in JasPer before 1.900.14 allows remote attackers to cause a denial of service (assertion failure) via a crafted image file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9388"
        ]
      },
      {
        "id": "CVE-2016-8654",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u2",
        "severity": "Medium",
        "description": "A heap-buffer overflow vulnerability was found in QMFB code in JPC codec caused by buffer being allocated with too small size. jasper versions before 2.0.0 are affected.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8654"
        ]
      },
      {
        "id": "CVE-2016-9399",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The calcstepsizes function in jpc_dec.c in JasPer 1.900.22 allows remote attackers to cause a denial of service (assertion failure) via unspecified vectors.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9399"
        ]
      },
      {
        "id": "CVE-2017-13752",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "There is a reachable assertion abort in the function jpc_dequantize() in jpc/jpc_dec.c in JasPer 2.0.12 that will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13752"
        ]
      },
      {
        "id": "CVE-2017-13749",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "There is a reachable assertion abort in the function jpc_pi_nextrpcl() in jpc/jpc_t2cod.c in JasPer 2.0.12 that will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13749"
        ]
      },
      {
        "id": "CVE-2018-20584",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u5",
        "severity": "Medium",
        "description": "JasPer 2.0.14 allows remote attackers to cause a denial of service (application hang) via an attempted conversion to the jp2 format.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20584"
        ]
      },
      {
        "id": "CVE-2016-8882",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u2",
        "severity": "Medium",
        "description": "The jpc_dec_tilefini function in libjasper/jpc/jpc_dec.c in JasPer before 1.900.8 allows remote attackers to cause a denial of service (NULL pointer dereference and crash) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8882"
        ]
      },
      {
        "id": "CVE-2018-9252",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "JasPer 2.0.14 allows denial of service via a reachable assertion in the function jpc_abstorelstepsize in libjasper/jpc/jpc_enc.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-9252"
        ]
      },
      {
        "id": "CVE-2016-9392",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The calcstepsizes function in jpc_dec.c in JasPer before 1.900.17 allows remote attackers to cause a denial of service (assertion failure) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9392"
        ]
      },
      {
        "id": "CVE-2016-8887",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jp2_colr_destroy function in libjasper/jp2/jp2_cod.c in JasPer before 1.900.10 allows remote attackers to cause a denial of service (NULL pointer dereference).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8887"
        ]
      },
      {
        "id": "CVE-2016-10248",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jpc_tsfb_synthesize function in jpc_tsfb.c in JasPer before 1.900.9 allows remote attackers to cause a denial of service (NULL pointer dereference) via vectors involving an empty sequence.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10248"
        ]
      },
      {
        "id": "CVE-2016-10251",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u3",
        "severity": "Medium",
        "description": "Integer overflow in the jpc_pi_nextcprl function in jpc_t2cod.c in JasPer before 1.900.20 allows remote attackers to have unspecified impact via a crafted file, which triggers use of an uninitialized value.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10251"
        ]
      },
      {
        "id": "CVE-2017-13750",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "There is a reachable assertion abort in the function jpc_dec_process_siz() in jpc/jpc_dec.c:1296 in JasPer 2.0.12 that will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13750"
        ]
      },
      {
        "id": "CVE-2017-5505",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jas_matrix_asl function in jas_seq.c in JasPer 1.900.27 allows remote attackers to cause a denial of service (invalid memory read and crash) via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5505"
        ]
      },
      {
        "id": "CVE-2017-5500",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "libjasper/jpc/jpc_dec.c in JasPer 1.900.17 allows remote attackers to cause a denial of service (crash) via vectors involving left shift of a negative value.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5500"
        ]
      },
      {
        "id": "CVE-2017-14229",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "There is an infinite loop in the jpc_dec_tileinit function in jpc/jpc_dec.c of Jasper 2.0.13. It will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14229"
        ]
      },
      {
        "id": "CVE-2016-8883",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jpc_dec_tiledecode function in jpc_dec.c in JasPer before 1.900.8 allows remote attackers to cause a denial of service (assertion failure) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8883"
        ]
      },
      {
        "id": "CVE-2017-5498",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "libjasper/include/jasper/jas_math.h in JasPer 1.900.17 allows remote attackers to cause a denial of service (crash) via vectors involving left shift of a negative value.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-5498"
        ]
      },
      {
        "id": "CVE-2017-13745",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "There is a reachable assertion abort in the function jpc_dec_process_sot() in jpc/jpc_dec.c in JasPer 2.0.12 that will lead to a remote denial of service attack by triggering an unexpected jpc_ppmstabtostreams return value, a different vulnerability than CVE-2018-9154.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13745"
        ]
      },
      {
        "id": "CVE-2016-9389",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jpc_irct and jpc_iict functions in jpc_mct.c in JasPer before 1.900.14 allow remote attackers to cause a denial of service (assertion failure).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9389"
        ]
      },
      {
        "id": "CVE-2016-9396",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The JPC_NOMINALGAIN function in jpc/jpc_t1cod.c in JasPer through 2.0.12 allows remote attackers to cause a denial of service (JPC_COX_RFT assertion failure) via unspecified vectors.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9396"
        ]
      },
      {
        "id": "CVE-2016-9387",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Integer overflow in the jpc_dec_process_siz function in libjasper/jpc/jpc_dec.c in JasPer before 1.900.13 allows remote attackers to have unspecified impact via a crafted file, which triggers an assertion failure.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9387"
        ]
      },
      {
        "id": "CVE-2016-8691",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u2",
        "severity": "Medium",
        "description": "The jpc_dec_process_siz function in libjasper/jpc/jpc_dec.c in JasPer before 1.900.4 allows remote attackers to cause a denial of service (divide-by-zero error and application crash) via a crafted XRsiz value in a BMP image to the imginfo command.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8691"
        ]
      },
      {
        "id": "CVE-2017-6850",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jp2_cdef_destroy function in jp2_cod.c in JasPer before 2.0.13 allows remote attackers to cause a denial of service (NULL pointer dereference) via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6850"
        ]
      },
      {
        "id": "CVE-2018-20570",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u5",
        "severity": "Medium",
        "description": "jp2_encode in jp2/jp2_enc.c in JasPer 2.0.14 has a heap-based buffer over-read.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20570"
        ]
      },
      {
        "id": "CVE-2017-13748",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u4",
        "severity": "Medium",
        "description": "There are lots of memory leaks in JasPer 2.0.12, triggered in the function jas_strdup() in base/jas_string.c, that will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13748"
        ]
      },
      {
        "id": "CVE-2018-18873",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u5",
        "severity": "Medium",
        "description": "An issue was discovered in JasPer 2.0.14. There is a NULL pointer dereference in the function ras_putdatastd in ras/ras_enc.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-18873"
        ]
      },
      {
        "id": "CVE-2016-9390",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jas_seq2d_create function in jas_seq.c in JasPer before 1.900.14 allows remote attackers to cause a denial of service (assertion failure) via a crafted image file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9390"
        ]
      },
      {
        "id": "CVE-2018-9055",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "JasPer 2.0.14 allows denial of service via a reachable assertion in the function jpc_firstone in libjasper/jpc/jpc_math.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-9055"
        ]
      },
      {
        "id": "CVE-2017-13746",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "There is a reachable assertion abort in the function jpc_dec_process_siz() in jpc/jpc_dec.c:1297 in JasPer 2.0.12 that will lead to a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-13746"
        ]
      },
      {
        "id": "CVE-2015-5203",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u4",
        "severity": "Medium",
        "description": "Double free vulnerability in the jasper_image_stop_load function in JasPer 1.900.17 allows remote attackers to cause a denial of service (crash) via a crafted JPEG 2000 image file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-5203"
        ]
      },
      {
        "id": "CVE-2017-1000050",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "JasPer 2.0.12 is vulnerable to a NULL pointer exception in the function jp2_encode which failed to check to see if the image contained at least one component resulting in a denial-of-service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000050"
        ]
      },
      {
        "id": "CVE-2018-20622",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u5",
        "severity": "Medium",
        "description": "JasPer 2.0.14 has a memory leak in base/jas_malloc.c in libjasper.a when \"--output-format jp2\" is used.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20622"
        ]
      },
      {
        "id": "CVE-2016-9393",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jpc_pi_nextrpcl function in jpc_t2cod.c in JasPer before 1.900.17 allows remote attackers to cause a denial of service (assertion failure) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9393"
        ]
      },
      {
        "id": "CVE-2016-9395",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jas_seq2d_create function in jas_seq.c in JasPer before 1.900.25 allows remote attackers to cause a denial of service (assertion failure) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9395"
        ]
      },
      {
        "id": "CVE-2016-9560",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u2",
        "severity": "Medium",
        "description": "Stack-based buffer overflow in the jpc_tsfb_getbands2 function in jpc_tsfb.c in JasPer before 1.900.30 allows remote attackers to have unspecified impact via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9560"
        ]
      },
      {
        "id": "CVE-2017-6852",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "Heap-based buffer overflow in the jpc_dec_decodepkt function in jpc_t2dec.c in JasPer 2.0.10 allows remote attackers to have unspecified impact via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6852"
        ]
      },
      {
        "id": "CVE-2018-19542",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u5",
        "severity": "Medium",
        "description": "An issue was discovered in JasPer 2.0.14. There is a NULL pointer dereference in the function jp2_decode in libjasper/jp2/jp2_dec.c, leading to a denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19542"
        ]
      },
      {
        "id": "CVE-2016-9557",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "Integer overflow in jas_image.c in JasPer before 1.900.25 allows remote attackers to cause a denial of service (application crash) via a crafted file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9557"
        ]
      },
      {
        "id": "CVE-2018-19540",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u5",
        "severity": "Medium",
        "description": "An issue was discovered in JasPer 2.0.14. There is a heap-based buffer overflow of size 1 in the function jas_icctxtdesc_input in libjasper/base/jas_icc.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19540"
        ]
      },
      {
        "id": "CVE-2017-9782",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "JasPer 2.0.12 allows remote attackers to cause a denial of service (heap-based buffer over-read and application crash) via a crafted image, related to the jp2_decode function in libjasper/jp2/jp2_dec.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9782"
        ]
      },
      {
        "id": "CVE-2018-19541",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u5",
        "severity": "Medium",
        "description": "An issue was discovered in JasPer 2.0.14. There is a heap-based buffer over-read of size 8 in the function jas_image_depalettize in libjasper/base/jas_image.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19541"
        ]
      },
      {
        "id": "CVE-2016-9398",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jpc_floorlog2 function in jpc_math.c in JasPer before 1.900.17 allows remote attackers to cause a denial of service (assertion failure) via unspecified vectors.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9398"
        ]
      },
      {
        "id": "CVE-2018-19139",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Low",
        "description": "An issue has been found in JasPer 2.0.14. There is a memory leak in jas_malloc.c when called from jpc_unk_getparms in jpc_cs.c.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-19139"
        ]
      },
      {
        "id": "CVE-2017-6851",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jas_matrix_bindsub function in jas_seq.c in JasPer 2.0.10 allows remote attackers to cause a denial of service (invalid read) via a crafted image.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6851"
        ]
      },
      {
        "id": "CVE-2016-9397",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The jpc_dequantize function in jpc_dec.c in JasPer 1.900.13 allows remote attackers to cause a denial of service (assertion failure) via unspecified vectors.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9397"
        ]
      },
      {
        "id": "CVE-2016-10249",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "1.900.1-debian1-2.4+deb8u3",
        "severity": "Medium",
        "description": "Integer overflow in the jpc_dec_tiledecode function in jpc_dec.c in JasPer before 1.900.12 allows remote attackers to have unspecified impact via a crafted image file, which triggers a heap-based buffer overflow.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-10249"
        ]
      },
      {
        "id": "CVE-2016-9583",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "An out-of-bounds heap read vulnerability was found in the jpc_pi_nextpcrl() function of jasper before 2.0.6 when processing crafted input.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9583"
        ]
      },
      {
        "id": "CVE-2018-9154",
        "package": "jasper",
        "version": "1.900.1-debian1-2.4+deb8u1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "There is a reachable abort in the function jpc_dec_process_sot in libjasper/jpc/jpc_dec.c of JasPer 2.0.14 that will lead to a remote denial of service attack by triggering an unexpected jas_alloc2 return value, a different vulnerability than CVE-2017-13745.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-9154"
        ]
      },
      {
        "id": "CVE-2016-7943",
        "package": "libx11",
        "version": "2:1.6.2-3",
        "fix_version": "2:1.6.2-3+deb8u1",
        "severity": "Low",
        "description": "The XListFonts function in X.org libX11 before 1.6.4 might allow remote X servers to gain privileges via vectors involving length fields, which trigger out-of-bounds write operations.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7943"
        ]
      },
      {
        "id": "CVE-2018-14598",
        "package": "libx11",
        "version": "2:1.6.2-3",
        "fix_version": "2:1.6.2-3+deb8u2",
        "severity": "Low",
        "description": "An issue was discovered in XListExtensions in ListExt.c in libX11 through 1.6.5. A malicious server can send a reply in which the first string overflows, causing a variable to be set to NULL that will be freed later on, leading to DoS (segmentation fault).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-14598"
        ]
      },
      {
        "id": "CVE-2016-7942",
        "package": "libx11",
        "version": "2:1.6.2-3",
        "fix_version": "2:1.6.2-3+deb8u1",
        "severity": "Low",
        "description": "The XGetImage function in X.org libX11 before 1.6.4 might allow remote X servers to gain privileges via vectors involving image type and geometry, which triggers out-of-bounds read operations.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7942"
        ]
      },
      {
        "id": "CVE-2018-14599",
        "package": "libx11",
        "version": "2:1.6.2-3",
        "fix_version": "2:1.6.2-3+deb8u2",
        "severity": "Low",
        "description": "An issue was discovered in libX11 through 1.6.5. The function XListExtensions in ListExt.c is vulnerable to an off-by-one error caused by malicious server responses, leading to DoS or possibly unspecified other impact.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-14599"
        ]
      },
      {
        "id": "CVE-2018-14600",
        "package": "libx11",
        "version": "2:1.6.2-3",
        "fix_version": "2:1.6.2-3+deb8u2",
        "severity": "Low",
        "description": "An issue was discovered in libX11 through 1.6.5. The function XListExtensions in ListExt.c interprets a variable as signed instead of unsigned, resulting in an out-of-bounds write (of up to 128 bytes), leading to DoS or remote code execution.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-14600"
        ]
      },
      {
        "id": "CVE-2015-9262",
        "package": "libxcursor",
        "version": "1:1.1.14-1",
        "fix_version": "1:1.1.14-1+deb8u2",
        "severity": "Low",
        "description": "_XcursorThemeInherits in library.c in libXcursor before 1.1.15 allows remote attackers to cause denial of service or potentially code execution via a one-byte heap overflow.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-9262"
        ]
      },
      {
        "id": "CVE-2017-16612",
        "package": "libxcursor",
        "version": "1:1.1.14-1",
        "fix_version": "1:1.1.14-1+deb8u1",
        "severity": "Medium",
        "description": "libXcursor before 1.1.15 has various integer overflows that could lead to heap buffer overflows when processing malicious cursors, e.g., with programs like GIMP. It is also possible that an attack vector exists against the related code in cursor/xcursor.c in Wayland through 1.14.0.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-16612"
        ]
      },
      {
        "id": "CVE-2016-8610",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u6",
        "severity": "Medium",
        "description": "A denial of service flaw was found in OpenSSL 0.9.8, 1.0.1, 1.0.2 through 1.0.2h, and 1.1.0 in the way the TLS/SSL protocol defined processing of ALERT packets during a connection handshake. A remote attacker could use this flaw to make a TLS/SSL server consume an excessive amount of CPU and fail to accept connections from other clients.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8610"
        ]
      },
      {
        "id": "CVE-2018-5407",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u10",
        "severity": "Low",
        "description": "Simultaneous Multi-threading (SMT) in processors can enable local users to exploit software vulnerable to timing attacks via a side-channel timing attack on 'port contention'.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-5407"
        ]
      },
      {
        "id": "CVE-2018-0734",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "",
        "severity": "Medium",
        "description": "The OpenSSL DSA signature algorithm has been shown to be vulnerable to a timing side channel attack. An attacker could use variations in the signing algorithm to recover the private key. Fixed in OpenSSL 1.1.1a (Affected 1.1.1). Fixed in OpenSSL 1.1.0j (Affected 1.1.0-1.1.0i). Fixed in OpenSSL 1.0.2q (Affected 1.0.2-1.0.2p).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-0734"
        ]
      },
      {
        "id": "CVE-2018-0735",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u10",
        "severity": "Negligible",
        "description": "The OpenSSL ECDSA signature algorithm has been shown to be vulnerable to a timing side channel attack. An attacker could use variations in the signing algorithm to recover the private key. Fixed in OpenSSL 1.1.0j (Affected 1.1.0-1.1.0i). Fixed in OpenSSL 1.1.1a (Affected 1.1.1).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-0735"
        ]
      },
      {
        "id": "CVE-2016-7056",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u6",
        "severity": "Negligible",
        "description": "A timing attack flaw was found in OpenSSL 1.0.1u and before that could allow a malicious user with local access to recover ECDSA P-256 private keys.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7056"
        ]
      },
      {
        "id": "CVE-2018-0732",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u9",
        "severity": "Low",
        "description": "During key agreement in a TLS handshake using a DH(E) based ciphersuite a malicious server can send a very large prime value to the client. This will cause the client to spend an unreasonably long period of time generating a key for this prime resulting in a hang until the client has finished. This could be exploited in a Denial Of Service attack. Fixed in OpenSSL 1.1.0i-dev (Affected 1.1.0-1.1.0h). Fixed in OpenSSL 1.0.2p-dev (Affected 1.0.2-1.0.2o).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-0732"
        ]
      },
      {
        "id": "CVE-2019-1563",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u12",
        "severity": "Medium",
        "description": "In situations where an attacker receives automated notification of the success or failure of a decryption attempt an attacker, after sending a very large number of messages to be decrypted, can recover a CMS/PKCS7 transported encryption key or decrypt any RSA encrypted message that was encrypted with the public RSA key, using a Bleichenbacher padding oracle attack. Applications are not affected if they use a certificate together with the private RSA key to the CMS_decrypt or PKCS7_decrypt functions to select the correct recipient info to decrypt. Fixed in OpenSSL 1.1.1d (Affected 1.1.1-1.1.1c). Fixed in OpenSSL 1.1.0l (Affected 1.1.0-1.1.0k). Fixed in OpenSSL 1.0.2t (Affected 1.0.2-1.0.2s).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1563"
        ]
      },
      {
        "id": "CVE-2010-0928",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "",
        "severity": "Negligible",
        "description": "OpenSSL 0.9.8i on the Gaisler Research LEON3 SoC on the Xilinx Virtex-II Pro FPGA uses a Fixed Width Exponentiation (FWE) algorithm for certain signature calculations, and does not verify the signature before providing it to a caller, which makes it easier for physically proximate attackers to determine the private key via a modified supply voltage for the microprocessor, related to a \"fault-based attack.\"",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2010-0928"
        ]
      },
      {
        "id": "CVE-2017-3731",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u6",
        "severity": "Medium",
        "description": "If an SSL/TLS server or client is running on a 32-bit host, and a specific cipher is being used, then a truncated packet can cause that server or client to perform an out-of-bounds read, usually resulting in a crash. For OpenSSL 1.1.0, the crash can be triggered when using CHACHA20/POLY1305; users should upgrade to 1.1.0d. For Openssl 1.0.2, the crash can be triggered when using RC4-MD5; users who have not disabled that algorithm should update to 1.0.2k.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-3731"
        ]
      },
      {
        "id": "CVE-2007-6755",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The NIST SP 800-90A default statement of the Dual Elliptic Curve Deterministic Random Bit Generation (Dual_EC_DRBG) algorithm contains point Q constants with a possible relationship to certain \"skeleton key\" values, which might allow context-dependent attackers to defeat cryptographic protection mechanisms by leveraging knowledge of those values.  NOTE: this is a preliminary CVE for Dual_EC_DRBG; future research may provide additional details about point Q and associated attacks, and could potentially lead to a RECAST or REJECT of this CVE.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2007-6755"
        ]
      },
      {
        "id": "CVE-2017-3735",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u7",
        "severity": "Medium",
        "description": "While parsing an IPAddressFamily extension in an X.509 certificate, it is possible to do a one-byte overread. This would result in an incorrect text display of the certificate. This bug has been present since 2006 and is present in all versions of OpenSSL before 1.0.2m and 1.1.0g.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-3735"
        ]
      },
      {
        "id": "CVE-2018-0739",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u8",
        "severity": "Low",
        "description": "Constructed ASN.1 types with a recursive definition (such as can be found in PKCS7) could eventually exceed the stack given malicious input with excessive recursion. This could result in a Denial Of Service attack. There are no such structures used within SSL/TLS that come from untrusted sources so this is considered safe. Fixed in OpenSSL 1.1.0h (Affected 1.1.0-1.1.0g). Fixed in OpenSSL 1.0.2o (Affected 1.0.2b-1.0.2n).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-0739"
        ]
      },
      {
        "id": "CVE-2019-1547",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u12",
        "severity": "Low",
        "description": "Normally in OpenSSL EC groups always have a co-factor present and this is used in side channel resistant code paths. However, in some cases, it is possible to construct a group using explicit parameters (instead of using a named curve). In those cases it is possible that such a group does not have the cofactor present. This can occur even where all the parameters match a known named curve. If such a curve is used then OpenSSL falls back to non-side channel resistant code paths which may result in full key recovery during an ECDSA signature operation. In order to be vulnerable an attacker would have to have the ability to time the creation of a large number of signatures where explicit parameters with no co-factor present are in use by an application using libcrypto. For the avoidance of doubt libssl is not vulnerable because explicit parameters are never used. Fixed in OpenSSL 1.1.1d (Affected 1.1.1-1.1.1c). Fixed in OpenSSL 1.1.0l (Affected 1.1.0-1.1.0k). Fixed in OpenSSL 1.0.2t (Affected 1.0.2-1.0.2s).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1547"
        ]
      },
      {
        "id": "CVE-2018-0737",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u9",
        "severity": "Low",
        "description": "The OpenSSL RSA Key generation algorithm has been shown to be vulnerable to a cache timing side channel attack. An attacker with sufficient access to mount cache timing attacks during the RSA key generation process could recover the private key. Fixed in OpenSSL 1.1.0i-dev (Affected 1.1.0-1.1.0h). Fixed in OpenSSL 1.0.2p-dev (Affected 1.0.2b-1.0.2o).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-0737"
        ]
      },
      {
        "id": "CVE-2019-1559",
        "package": "openssl",
        "version": "1.0.1t-1+deb8u5",
        "fix_version": "1.0.1t-1+deb8u11",
        "severity": "Medium",
        "description": "If an application encounters a fatal protocol error and then calls SSL_shutdown() twice (once to send a close_notify, and once to receive one) then OpenSSL can respond differently to the calling application if a 0 byte record is received with invalid padding compared to if a 0 byte record is received with an invalid MAC. If the application then behaves differently based on that in a way that is detectable to the remote peer, then this amounts to a padding oracle that could be used to decrypt data. In order for this to be exploitable \"non-stitched\" ciphersuites must be in use. Stitched ciphersuites are optimised implementations of certain commonly used ciphersuites. Also the application must call SSL_shutdown() twice even if a protocol error has occurred (applications should not do this but some do anyway). Fixed in OpenSSL 1.0.2r (Affected 1.0.2-1.0.2q).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1559"
        ]
      },
      {
        "id": "CVE-2019-5094",
        "package": "e2fsprogs",
        "version": "1.42.12-2",
        "fix_version": "1.42.12-2+deb8u1",
        "severity": "Medium",
        "description": "An exploitable code execution vulnerability exists in the quota file functionality of E2fsprogs 1.45.3. A specially crafted ext4 partition can cause an out-of-bounds write on the heap, resulting in code execution. An attacker can corrupt a partition to trigger this vulnerability.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-5094"
        ]
      },
      {
        "id": "CVE-2019-5188",
        "package": "e2fsprogs",
        "version": "1.42.12-2",
        "fix_version": "",
        "severity": "Medium",
        "description": "A code execution vulnerability exists in the directory rehashing functionality of E2fsprogs e2fsck 1.45.4. A specially crafted ext4 directory can cause an out-of-bounds write on the stack, resulting in code execution. An attacker can corrupt a partition to trigger this vulnerability.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-5188"
        ]
      },
      {
        "id": "CVE-2016-7167",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u13",
        "severity": "High",
        "description": "Multiple integer overflows in the (1) curl_escape, (2) curl_easy_escape, (3) curl_unescape, and (4) curl_easy_unescape functions in libcurl before 7.50.3 allow attackers to have unspecified impact via a string of length 0xffffffff, which triggers a heap-based buffer overflow.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7167"
        ]
      },
      {
        "id": "CVE-2016-7141",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u13",
        "severity": "Medium",
        "description": "curl and libcurl before 7.50.2, when built with NSS and the libnsspem.so library is available at runtime, allow remote attackers to hijack the authentication of a TLS connection by leveraging reuse of a previously loaded client certificate from file for a connection for which no certificate has been set, a different vulnerability than CVE-2016-5420.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7141"
        ]
      },
      {
        "id": "CVE-2018-1000122",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u10",
        "severity": "Medium",
        "description": "A buffer over-read exists in curl 7.20.0 to and including curl 7.58.0 in the RTSP+RTP handling code that allows an attacker to cause a denial of service or information leakage",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000122"
        ]
      },
      {
        "id": "CVE-2017-7407",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The ourWriteOut function in tool_writeout.c in curl 7.53.1 might allow physically proximate attackers to obtain sensitive information from process memory in opportunistic circumstances by reading a workstation screen during use of a --write-out argument ending in a '%' character, which leads to a heap-based buffer over-read.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7407"
        ]
      },
      {
        "id": "CVE-2018-1000301",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u11",
        "severity": "Medium",
        "description": "curl version curl 7.20.0 to and including curl 7.59.0 contains a CWE-126: Buffer Over-read vulnerability in denial of service that can result in curl can be tricked into reading data beyond the end of a heap based buffer used to store downloaded RTSP content.. This vulnerability appears to have been fixed in curl \u003c 7.20.0 and curl \u003e= 7.60.0.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000301"
        ]
      },
      {
        "id": "CVE-2018-1000121",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u10",
        "severity": "Medium",
        "description": "A NULL pointer dereference exists in curl 7.21.0 to and including curl 7.58.0 in the LDAP code that allows an attacker to cause a denial of service",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000121"
        ]
      },
      {
        "id": "CVE-2018-1000120",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u10",
        "severity": "High",
        "description": "A buffer overflow exists in curl 7.12.3 to and including curl 7.58.0 in the FTP URL handling that allows an attacker to cause a denial of service or worse.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000120"
        ]
      },
      {
        "id": "CVE-2017-8816",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u8",
        "severity": "High",
        "description": "The NTLM authentication feature in curl and libcurl before 7.57.0 on 32-bit platforms allows attackers to cause a denial of service (integer overflow and resultant buffer overflow, and application crash) or possibly have unspecified other impact via vectors involving long user and password fields.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-8816"
        ]
      },
      {
        "id": "CVE-2019-5482",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u16",
        "severity": "High",
        "description": "Heap buffer overflow in the TFTP protocol handler in cURL 7.19.4 to 7.65.3.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-5482"
        ]
      },
      {
        "id": "CVE-2018-1000007",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u9",
        "severity": "Medium",
        "description": "libcurl 7.1 through 7.57.0 might accidentally leak authentication data to third parties. When asked to send custom headers in its HTTP requests, libcurl will send that set of headers first to the host in the initial URL but also, if asked to follow redirects and a 30X HTTP response code is returned, to the host mentioned in URL in the `Location:` response header value. Sending the same set of headers to subsequent hosts is in particular a problem for applications that pass on custom `Authorization:` headers, as this header often contains privacy sensitive information or data that could allow others to impersonate the libcurl-using client's request.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000007"
        ]
      },
      {
        "id": "CVE-2016-3739",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The (1) mbed_connect_step1 function in lib/vtls/mbedtls.c and (2) polarssl_connect_step1 function in lib/vtls/polarssl.c in cURL and libcurl before 7.49.0, when using SSLv3 or making a TLS connection to a URL that uses a numerical IP address, allow remote attackers to spoof servers via an arbitrary valid certificate.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-3739"
        ]
      },
      {
        "id": "CVE-2019-3822",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u14",
        "severity": "High",
        "description": "libcurl versions from 7.36.0 to before 7.64.0 are vulnerable to a stack-based buffer overflow. The function creating an outgoing NTLM type-3 header (`lib/vauth/ntlm.c:Curl_auth_create_ntlm_type3_message()`), generates the request HTTP header contents based on previously received data. The check that exists to prevent the local buffer from getting overflowed is implemented wrongly (using unsigned math) and as such it does not prevent the overflow from happening. This output data can grow larger than the local buffer if very large 'nt response' data is extracted from a previous NTLMv2 header provided by the malicious or broken HTTP server. Such a 'large value' needs to be around 1000 bytes or more. The actual payload data copied to the target buffer comes from the NTLMv2 type-2 response header.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3822"
        ]
      },
      {
        "id": "CVE-2017-1000100",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u6",
        "severity": "Medium",
        "description": "When doing a TFTP transfer and curl/libcurl is given a URL that contains a very long file name (longer than about 515 bytes), the file name is truncated to fit within the buffer boundaries, but the buffer size is still wrongly updated to use the untruncated length. This too large value is then used in the sendto() call, making curl attempt to send more data than what is actually put into the buffer. The endto() function will then read beyond the end of the heap based buffer. A malicious HTTP(S) server could redirect a vulnerable libcurl-using client to a crafted TFTP URL (if the client hasn't restricted which protocols it allows redirects to) and trick it to send private memory contents to a remote server over UDP. Limit curl's redirect protocols with --proto-redir and libcurl's with CURLOPT_REDIR_PROTOCOLS.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000100"
        ]
      },
      {
        "id": "CVE-2016-8625",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "",
        "severity": "Medium",
        "description": "curl before version 7.51.0 uses outdated IDNA 2003 standard to handle International Domain Names and this may lead users to potentially and unknowingly issue network transfer requests to the wrong host.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8625"
        ]
      },
      {
        "id": "CVE-2019-5436",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u15",
        "severity": "Medium",
        "description": "A heap buffer overflow in the TFTP receiving code allows for DoS or arbitrary code execution in libcurl versions 7.19.4 through 7.64.1.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-5436"
        ]
      },
      {
        "id": "CVE-2017-1000257",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u7",
        "severity": "Medium",
        "description": "An IMAP FETCH response line indicates the size of the returned data, in number of bytes. When that response says the data is zero bytes, libcurl would pass on that (non-existing) data with a pointer and the size (zero) to the deliver-data function. libcurl's deliver-data function treats zero as a magic number and invokes strlen() on the data to figure out the length. The strlen() is called on a heap based buffer that might not be zero terminated so libcurl might read beyond the end of it into whatever memory lies after (or just crash) and then deliver that to the application as if it was actually downloaded.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000257"
        ]
      },
      {
        "id": "CVE-2017-1000101",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u6",
        "severity": "Medium",
        "description": "curl supports \"globbing\" of URLs, in which a user can pass a numerical range to have the tool iterate over those numbers to do a sequence of transfers. In the globbing function that parses the numerical range, there was an omission that made curl read a byte beyond the end of the URL if given a carefully crafted, or just wrongly written, URL. The URL is stored in a heap based buffer, so it could then be made to wrongly read something else instead of crashing. An example of a URL that triggers the flaw would be `http://ur%20[0-60000000000000000000`.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000101"
        ]
      },
      {
        "id": "CVE-2019-3823",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u14",
        "severity": "Medium",
        "description": "libcurl versions from 7.34.0 to before 7.64.0 are vulnerable to a heap out-of-bounds read in the code handling the end-of-response for SMTP. If the buffer passed to `smtp_endofresp()` isn't NUL terminated and contains no character ending the parsed number, and `len` is set to 5, then the `strtol()` call reads beyond the allocated buffer. The read contents will not be returned to the caller.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3823"
        ]
      },
      {
        "id": "CVE-2016-9586",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u13",
        "severity": "Medium",
        "description": "curl before version 7.52.0 is vulnerable to a buffer overflow when doing a large floating point output in libcurl's implementation of the printf() functions. If there are any application that accepts a format string from the outside without necessary input filtering, it could allow remote attacks.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9586"
        ]
      },
      {
        "id": "CVE-2018-16842",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u13",
        "severity": "Medium",
        "description": "Curl versions 7.14.1 through 7.61.1 are vulnerable to a heap-based buffer over-read in the tool_msgs.c:voutf() function that may result in information exposure and denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16842"
        ]
      },
      {
        "id": "CVE-2017-8817",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u8",
        "severity": "High",
        "description": "The FTP wildcard function in curl and libcurl before 7.57.0 allows remote attackers to cause a denial of service (out-of-bounds read and application crash) or possibly have unspecified other impact via a string that ends with an '[' character.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-8817"
        ]
      },
      {
        "id": "CVE-2017-1000254",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u6",
        "severity": "Medium",
        "description": "libcurl may read outside of a heap allocated buffer when doing FTP. When libcurl connects to an FTP server and successfully logs in (anonymous or not), it asks the server for the current directory with the `PWD` command. The server then responds with a 257 response containing the path, inside double quotes. The returned path name is then kept by libcurl for subsequent uses. Due to a flaw in the string parser for this directory name, a directory name passed like this but without a closing double quote would lead to libcurl not adding a trailing NUL byte to the buffer holding the name. When libcurl would then later access the string, it could read beyond the allocated heap buffer and crash or wrongly access data beyond the buffer, thinking it was part of the path. A malicious server could abuse this fact and effectively prevent libcurl-based clients to work with it - the PWD command is always issued on new FTP connections and the mistake has a high chance of causing a segfault. The simple fact that this has issue remained undiscovered for this long could suggest that malformed PWD responses are rare in benign servers. We are not aware of any exploit of this flaw. This bug was introduced in commit [415d2e7cb7](https://github.com/curl/curl/commit/415d2e7cb7), March 2005. In libcurl version 7.56.0, the parser always zero terminates the string but also rejects it if not terminated properly with a final double quote.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000254"
        ]
      },
      {
        "id": "CVE-2018-14618",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u12",
        "severity": "Critical",
        "description": "curl before version 7.61.1 is vulnerable to a buffer overrun in the NTLM authentication code. The internal function Curl_ntlm_core_mk_nt_hash multiplies the length of the password by two (SUM) to figure out how large temporary storage area to allocate from the heap. The length value is then subsequently used to iterate over the password and generate output into the allocated storage buffer. On systems with a 32 bit size_t, the math to calculate SUM triggers an integer overflow when the password length exceeds 2GB (2^31 bytes). This integer overflow usually causes a very small buffer to actually get allocated instead of the intended very huge one, making the use of that buffer end up in a heap buffer overflow. (This bug is almost identical to CVE-2017-8816.)",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-14618"
        ]
      },
      {
        "id": "CVE-2018-16839",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u13",
        "severity": "High",
        "description": "Curl versions 7.33.0 through 7.61.1 are vulnerable to a buffer overrun in the SASL authentication code that may lead to denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16839"
        ]
      },
      {
        "id": "CVE-2018-16890",
        "package": "curl",
        "version": "7.38.0-4+deb8u5",
        "fix_version": "7.38.0-4+deb8u14",
        "severity": "Medium",
        "description": "libcurl versions from 7.36.0 to before 7.64.0 is vulnerable to a heap buffer out-of-bounds read. The function handling incoming NTLM type-2 messages (`lib/vauth/ntlm.c:ntlm_decode_type2_target`) does not validate incoming data correctly and is subject to an integer overflow vulnerability. Using that overflow, a malicious or broken NTLM server could trick libcurl to accept a bad length + offset combination that would lead to a buffer read out-of-bounds.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16890"
        ]
      },
      {
        "id": "CVE-2015-8271",
        "package": "rtmpdump",
        "version": "2.4+20150115.gita107cef-1",
        "fix_version": "2.4+20150115.gita107cef-1+deb8u1",
        "severity": "High",
        "description": "The AMF3CD_AddProp function in amf.c in RTMPDump 2.4 allows remote RTMP Media servers to execute arbitrary code.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-8271"
        ]
      },
      {
        "id": "CVE-2015-8272",
        "package": "rtmpdump",
        "version": "2.4+20150115.gita107cef-1",
        "fix_version": "2.4+20150115.gita107cef-1+deb8u1",
        "severity": "Medium",
        "description": "RTMPDump 2.4 allows remote attackers to trigger a denial of service (NULL pointer dereference and process crash).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-8272"
        ]
      },
      {
        "id": "CVE-2015-8270",
        "package": "rtmpdump",
        "version": "2.4+20150115.gita107cef-1",
        "fix_version": "2.4+20150115.gita107cef-1+deb8u1",
        "severity": "Medium",
        "description": "The AMF3ReadString function in amf.c in RTMPDump 2.4 allows remote RTMP Media servers to cause a denial of service (invalid pointer dereference and process crash).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-8270"
        ]
      },
      {
        "id": "CVE-2016-7952",
        "package": "libxtst",
        "version": "2:1.2.2-1",
        "fix_version": "2:1.2.2-1+deb8u1",
        "severity": "Low",
        "description": "X.org libXtst before 1.2.3 allows remote X servers to cause a denial of service (infinite loop) via a reply in the (1) XRecordStartOfData, (2) XRecordEndOfData, or (3) XRecordClientDied category without a client sequence and with attached data.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7952"
        ]
      },
      {
        "id": "CVE-2016-7951",
        "package": "libxtst",
        "version": "2:1.2.2-1",
        "fix_version": "2:1.2.2-1+deb8u1",
        "severity": "Low",
        "description": "Multiple integer overflows in X.org libXtst before 1.2.3 allow remote X servers to trigger out-of-bounds memory access operations by leveraging the lack of range checks.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7951"
        ]
      },
      {
        "id": "CVE-2015-5297",
        "package": "pixman",
        "version": "0.32.6-3",
        "fix_version": "0.32.6-3+deb8u1",
        "severity": "High",
        "description": "An integer overflow issue has been reported in the general_composite_rect() function in pixman prior to version 0.32.8. An attacker could exploit this issue to cause an application using pixman to crash or, potentially, execute arbitrary code.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-5297"
        ]
      },
      {
        "id": "CVE-2017-6888",
        "package": "flac",
        "version": "1.3.0-3",
        "fix_version": "",
        "severity": "Low",
        "description": "An error in the \"read_metadata_vorbiscomment_()\" function (src/libFLAC/stream_decoder.c) in FLAC version 1.3.2 can be exploited to cause a memory leak via a specially crafted FLAC file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6888"
        ]
      },
      {
        "id": "CVE-2017-9937",
        "package": "jbigkit",
        "version": "2.1-3.1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "In LibTIFF 4.0.8, there is a memory malloc failure in tif_jbig.c. A crafted TIFF document can lead to an abort resulting in a remote denial of service attack.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9937"
        ]
      },
      {
        "id": "CVE-2016-7944",
        "package": "libxfixes",
        "version": "1:5.0.1-2",
        "fix_version": "1:5.0.1-2+deb8u1",
        "severity": "Low",
        "description": "Integer overflow in X.org libXfixes before 5.0.3 on 32-bit platforms might allow remote X servers to gain privileges via a length value of INT_MAX, which triggers the client to stop reading data and get out of sync.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7944"
        ]
      },
      {
        "id": "CVE-2019-0053",
        "package": "inetutils",
        "version": "2:1.9.2.39.3a460-3",
        "fix_version": "",
        "severity": "Low",
        "description": "Insufficient validation of environment variables in the telnet client supplied in Junos OS can lead to stack-based buffer overflows, which can be exploited to bypass veriexec restrictions on Junos OS. A stack-based overflow is present in the handling of environment variables when connecting via the telnet client to remote telnet servers. This issue only affects the telnet client — accessible from the CLI or shell — in Junos OS. Inbound telnet services are not affected by this issue. This issue affects: Juniper Networks Junos OS: 12.3 versions prior to 12.3R12-S13; 12.3X48 versions prior to 12.3X48-D80; 14.1X53 versions prior to 14.1X53-D130, 14.1X53-D49; 15.1 versions prior to 15.1F6-S12, 15.1R7-S4; 15.1X49 versions prior to 15.1X49-D170; 15.1X53 versions prior to 15.1X53-D237, 15.1X53-D496, 15.1X53-D591, 15.1X53-D69; 16.1 versions prior to 16.1R3-S11, 16.1R7-S4; 16.2 versions prior to 16.2R2-S9; 17.1 versions prior to 17.1R3; 17.2 versions prior to 17.2R1-S8, 17.2R2-S7, 17.2R3-S1; 17.3 versions prior to 17.3R3-S4; 17.4 versions prior to 17.4R1-S6, 17.4R2-S3, 17.4R3; 18.1 versions prior to 18.1R2-S4, 18.1R3-S3; 18.2 versions prior to 18.2R1-S5, 18.2R2-S2, 18.2R3; 18.2X75 versions prior to 18.2X75-D40; 18.3 versions prior to 18.3R1-S3, 18.3R2; 18.4 versions prior to 18.4R1-S2, 18.4R2.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-0053"
        ]
      },
      {
        "id": "CVE-2017-1000376",
        "package": "libffi",
        "version": "3.1-2",
        "fix_version": "3.1-2+deb8u1",
        "severity": "High",
        "description": "libffi requests an executable stack allowing attackers to more easily trigger arbitrary code execution by overwriting the stack. Please note that libffi is used by a number of other libraries. It was previously stated that this affects libffi version 3.2.1 but this appears to be incorrect. libffi prior to version 3.1 on 32 bit x86 systems was vulnerable, and upstream is believed to have fixed this issue in version 3.1.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000376"
        ]
      },
      {
        "id": "CVE-2017-12618",
        "package": "apr-util",
        "version": "1.5.4-1",
        "fix_version": "",
        "severity": "Low",
        "description": "Apache Portable Runtime Utility (APR-util) 1.6.0 and prior fail to validate the integrity of SDBM database files used by apr_sdbm*() functions, resulting in a possible out of bound read access. A local user with write access to the database can make a program or process using these functions crash, and cause a denial of service.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-12618"
        ]
      },
      {
        "id": "CVE-2017-1000117",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "1:2.1.4-2.1+deb8u4",
        "severity": "Medium",
        "description": "A malicious third-party can give a crafted \"ssh://...\" URL to an unsuspecting victim, and an attempt to visit the URL can result in any program that exists on the victim's machine being executed. Such a URL could be placed in the .gitmodules file of a malicious project, and an unsuspecting victim could be tricked into running \"git clone --recurse-submodules\" to trigger the vulnerability.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-1000117"
        ]
      },
      {
        "id": "CVE-2017-8386",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "1:2.1.4-2.1+deb8u3",
        "severity": "Medium",
        "description": "git-shell in git before 2.4.12, 2.5.x before 2.5.6, 2.6.x before 2.6.7, 2.7.x before 2.7.5, 2.8.x before 2.8.5, 2.9.x before 2.9.4, 2.10.x before 2.10.3, 2.11.x before 2.11.2, and 2.12.x before 2.12.3 might allow remote authenticated users to gain privileges via a repository name that starts with a - (dash) character.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-8386"
        ]
      },
      {
        "id": "CVE-2018-11233",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "1:2.1.4-2.1+deb8u6",
        "severity": "Negligible",
        "description": "In Git before 2.13.7, 2.14.x before 2.14.4, 2.15.x before 2.15.2, 2.16.x before 2.16.4, and 2.17.x before 2.17.1, code to sanity-check pathnames on NTFS can result in reading out-of-bounds memory.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-11233"
        ]
      },
      {
        "id": "CVE-2018-11235",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "1:2.1.4-2.1+deb8u6",
        "severity": "Medium",
        "description": "In Git before 2.13.7, 2.14.x before 2.14.4, 2.15.x before 2.15.2, 2.16.x before 2.16.4, and 2.17.x before 2.17.1, remote code execution can occur. With a crafted .gitmodules file, a malicious project can execute an arbitrary script on a machine that runs \"git clone --recurse-submodules\" because submodule \"names\" are obtained from this file, and then appended to $GIT_DIR/modules, leading to directory traversal with \"../\" in a name. Finally, post-checkout hooks from a submodule are executed, bypassing the intended design in which hooks are not obtained from a remote server.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-11235"
        ]
      },
      {
        "id": "CVE-2018-1000021",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "GIT version 2.15.1 and earlier contains a Input Validation Error vulnerability in Client that can result in problems including messing up terminal configuration to RCE. This attack appear to be exploitable via The user must interact with a malicious git server, (or have their traffic modified in a MITM attack).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1000021"
        ]
      },
      {
        "id": "CVE-2017-15298",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Git through 2.14.2 mishandles layers of tree objects, which allows remote attackers to cause a denial of service (memory consumption) via a crafted repository, aka a Git bomb. This can also have an impact of disk consumption; however, an affected process typically would not survive its attempt to build the data structure in memory before writing to disk.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-15298"
        ]
      },
      {
        "id": "CVE-2017-14867",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "1:2.1.4-2.1+deb8u5",
        "severity": "Critical",
        "description": "Git before 2.10.5, 2.11.x before 2.11.4, 2.12.x before 2.12.5, 2.13.x before 2.13.6, and 2.14.x before 2.14.2 uses unsafe Perl scripts to support subcommands such as cvsserver, which allows attackers to execute arbitrary OS commands via shell metacharacters in a module name. The vulnerable code is reachable via git-shell even without CVS support.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-14867"
        ]
      },
      {
        "id": "CVE-2018-17456",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "1:2.1.4-2.1+deb8u7",
        "severity": "High",
        "description": "Git before 2.14.5, 2.15.x before 2.15.3, 2.16.x before 2.16.5, 2.17.x before 2.17.2, 2.18.x before 2.18.1, and 2.19.x before 2.19.1 allows remote code execution during processing of a recursive \"git clone\" of a superproject if a .gitmodules file has a URL field beginning with a '-' character.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-17456"
        ]
      },
      {
        "id": "CVE-2019-1387",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "1:2.1.4-2.1+deb8u8",
        "severity": "Medium",
        "description": "An issue was found in Git before v2.24.1, v2.23.1, v2.22.2, v2.21.1, v2.20.2, v2.19.3, v2.18.2, v2.17.3, v2.16.6, v2.15.4, and v2.14.6. Recursive clones are currently affected by a vulnerability that is caused by too-lax validation of submodule names, allowing very targeted attacks via remote code execution in recursive clones.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1387"
        ]
      },
      {
        "id": "CVE-2019-1354",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "A remote code execution vulnerability exists when Git for Visual Studio improperly sanitizes input, aka 'Git for Visual Studio Remote Code Execution Vulnerability'. This CVE ID is unique from CVE-2019-1349, CVE-2019-1350, CVE-2019-1352, CVE-2019-1387.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1354"
        ]
      },
      {
        "id": "CVE-2019-1349",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "1:2.1.4-2.1+deb8u8",
        "severity": "Critical",
        "description": "A remote code execution vulnerability exists when Git for Visual Studio improperly sanitizes input, aka 'Git for Visual Studio Remote Code Execution Vulnerability'. This CVE ID is unique from CVE-2019-1350, CVE-2019-1352, CVE-2019-1354, CVE-2019-1387.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1349"
        ]
      },
      {
        "id": "CVE-2019-1348",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "1:2.1.4-2.1+deb8u8",
        "severity": "Low",
        "description": "An issue was found in Git before v2.24.1, v2.23.1, v2.22.2, v2.21.1, v2.20.2, v2.19.3, v2.18.2, v2.17.3, v2.16.6, v2.15.4, and v2.14.6. The --export-marks option of git fast-import is exposed also via the in-stream command feature export-marks=... and it allows overwriting arbitrary paths.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1348"
        ]
      },
      {
        "id": "CVE-2019-1351",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "A tampering vulnerability exists when Git for Visual Studio improperly handles virtual drive paths, aka 'Git for Visual Studio Tampering Vulnerability'.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1351"
        ]
      },
      {
        "id": "CVE-2019-1352",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "1:2.1.4-2.1+deb8u8",
        "severity": "Critical",
        "description": "A remote code execution vulnerability exists when Git for Visual Studio improperly sanitizes input, aka 'Git for Visual Studio Remote Code Execution Vulnerability'. This CVE ID is unique from CVE-2019-1349, CVE-2019-1350, CVE-2019-1354, CVE-2019-1387.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1352"
        ]
      },
      {
        "id": "CVE-2019-1350",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "A remote code execution vulnerability exists when Git for Visual Studio improperly sanitizes input, aka 'Git for Visual Studio Remote Code Execution Vulnerability'. This CVE ID is unique from CVE-2019-1349, CVE-2019-1352, CVE-2019-1354, CVE-2019-1387.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1350"
        ]
      },
      {
        "id": "CVE-2019-1353",
        "package": "git",
        "version": "1:2.1.4-2.1+deb8u2",
        "fix_version": "1:2.1.4-2.1+deb8u8",
        "severity": "High",
        "description": "An issue was found in Git before v2.24.1, v2.23.1, v2.22.2, v2.21.1, v2.20.2, v2.19.3, v2.18.2, v2.17.3, v2.16.6, v2.15.4, and v2.14.6. When running Git in the Windows Subsystem for Linux (also known as \"WSL\") while accessing a working directory on a regular Windows drive, none of the NTFS protections were active.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-1353"
        ]
      },
      {
        "id": "CVE-2017-2625",
        "package": "libxdmcp",
        "version": "1:1.1.1-1",
        "fix_version": "1:1.1.1-1+deb8u1",
        "severity": "Low",
        "description": "It was discovered that libXdmcp before 1.1.2 including used weak entropy to generate session keys. On a multi-user system using xdmcp, a local attacker could potentially use information available from the process list to brute force the key, allowing them to hijack other users' sessions.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-2625"
        ]
      },
      {
        "id": "CVE-2015-8947",
        "package": "harfbuzz",
        "version": "0.9.35-2",
        "fix_version": "0.9.35-2+deb8u1",
        "severity": "High",
        "description": "hb-ot-layout-gpos-table.hh in HarfBuzz before 1.0.5 allows remote attackers to cause a denial of service (buffer over-read) or possibly have unspecified other impact via crafted data, a different vulnerability than CVE-2016-2052.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-8947"
        ]
      },
      {
        "id": "CVE-2019-14855",
        "package": "gnupg",
        "version": "1.4.18-7+deb8u3",
        "fix_version": "",
        "severity": "Low",
        "description": "",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-14855"
        ]
      },
      {
        "id": "CVE-2018-12020",
        "package": "gnupg",
        "version": "1.4.18-7+deb8u3",
        "fix_version": "1.4.18-7+deb8u5",
        "severity": "Negligible",
        "description": "mainproc.c in GnuPG before 2.2.8 mishandles the original filename during decryption and verification actions, which allows remote attackers to spoof the output that GnuPG sends on file descriptor 2 to other programs that use the \"--status-fd 2\" option. For example, the OpenPGP data might represent an original filename that contains line feed characters in conjunction with GOODSIG or VALIDSIG status codes.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-12020"
        ]
      },
      {
        "id": "CVE-2017-7526",
        "package": "gnupg",
        "version": "1.4.18-7+deb8u3",
        "fix_version": "1.4.18-7+deb8u4",
        "severity": "Negligible",
        "description": "libgcrypt before version 1.7.8 is vulnerable to a cache side-channel attack resulting into a complete break of RSA-1024 while using the left-to-right method for computing the sliding-window expansion. The same attack is believed to work on RSA-2048 with moderately more computation. This side-channel requires that attacker can run arbitrary software on the hardware where the private RSA key is used.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-7526"
        ]
      },
      {
        "id": "CVE-2018-6829",
        "package": "gnupg",
        "version": "1.4.18-7+deb8u3",
        "fix_version": "",
        "severity": "Negligible",
        "description": "cipher/elgamal.c in Libgcrypt through 1.8.2, when used to encrypt messages directly, improperly encodes plaintexts, which allows attackers to obtain sensitive information by reading ciphertext data (i.e., it does not have semantic security in face of a ciphertext-only attack). The Decisional Diffie-Hellman (DDH) assumption does not hold for Libgcrypt's ElGamal implementation.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-6829"
        ]
      },
      {
        "id": "CVE-2016-7945",
        "package": "libxi",
        "version": "2:1.7.4-1",
        "fix_version": "2:1.7.4-1+deb8u1",
        "severity": "Low",
        "description": "Multiple integer overflows in X.org libXi before 1.7.7 allow remote X servers to cause a denial of service (out-of-bounds memory access or infinite loop) via vectors involving length fields.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7945"
        ]
      },
      {
        "id": "CVE-2016-7946",
        "package": "libxi",
        "version": "2:1.7.4-1",
        "fix_version": "2:1.7.4-1+deb8u1",
        "severity": "Low",
        "description": "X.org libXi before 1.7.7 allows remote X servers to cause a denial of service (infinite loop) via vectors involving length fields.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-7946"
        ]
      },
      {
        "id": "CVE-2019-3842",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "215-17+deb8u12",
        "severity": "Medium",
        "description": "In systemd before v242-rc4, it was discovered that pam_systemd does not properly sanitize the environment before using the XDG_SEAT variable. It is possible for an attacker, in some particular configurations, to set a XDG_SEAT environment variable which allows for commands to be checked against polkit policies using the \"allow_active\" element rather than \"allow_any\".",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3842"
        ]
      },
      {
        "id": "CVE-2017-18078",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "215-17+deb8u12",
        "severity": "Negligible",
        "description": "systemd-tmpfiles in systemd before 237 attempts to support ownership/permission changes on hardlinked files even if the fs.protected_hardlinks sysctl is turned off, which allows local users to bypass intended access restrictions via vectors involving a hard link to a file for which the user lacks write access, as demonstrated by changing the ownership of the /etc/passwd file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-18078"
        ]
      },
      {
        "id": "CVE-2018-16864",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "215-17+deb8u9",
        "severity": "Medium",
        "description": "An allocation of memory without limits, that could result in the stack clashing with another memory region, was discovered in systemd-journald when a program with long command line arguments calls syslog. A local attacker may use this flaw to crash systemd-journald or escalate his privileges. Versions through v240 are vulnerable.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16864"
        ]
      },
      {
        "id": "CVE-2019-6454",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "215-17+deb8u10",
        "severity": "Medium",
        "description": "An issue was discovered in sd-bus in systemd 239. bus_process_object() in libsystemd/sd-bus/bus-objects.c allocates a variable-length stack buffer for temporarily storing the object path of incoming D-Bus messages. An unprivileged local user can exploit this by sending a specially crafted message to PID1, causing the stack pointer to jump over the stack guard pages into an unmapped memory region and trigger a denial of service (systemd PID1 crash and kernel panic).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-6454"
        ]
      },
      {
        "id": "CVE-2018-16865",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "215-17+deb8u9",
        "severity": "Medium",
        "description": "An allocation of memory without limits, that could result in the stack clashing with another memory region, was discovered in systemd-journald when many entries are sent to the journal socket. A local attacker, or a remote one if systemd-journal-remote is used, may use this flaw to crash systemd-journald or execute code with journald privileges. Versions through v240 are vulnerable.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16865"
        ]
      },
      {
        "id": "CVE-2013-4392",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "",
        "severity": "Negligible",
        "description": "systemd, when updating file permissions, allows local users to change the permissions and SELinux security contexts for arbitrary files via a symlink attack on unspecified files.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2013-4392"
        ]
      },
      {
        "id": "CVE-2018-16888",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "",
        "severity": "Low",
        "description": "It was discovered systemd does not correctly check the content of PIDFile files before using it to kill processes. When a service is run from an unprivileged user (e.g. User field set in the service file), a local attacker who is able to write to the PIDFile of the mentioned service may use this flaw to trick systemd into killing other services and/or privileged processes. Versions before v237 are vulnerable.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16888"
        ]
      },
      {
        "id": "CVE-2018-15688",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "215-17+deb8u8",
        "severity": "Negligible",
        "description": "A buffer overflow vulnerability in the dhcp6 client of systemd allows a malicious dhcp6 server to overwrite heap memory in systemd-networkd. Affected releases are systemd: versions up to and including 239.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-15688"
        ]
      },
      {
        "id": "CVE-2018-15686",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "215-17+deb8u8",
        "severity": "Critical",
        "description": "A vulnerability in unit_deserialize of systemd allows an attacker to supply arbitrary state across systemd re-execution via NotifyAccess. This can be used to improperly influence systemd execution and possibly lead to root privilege escalation. Affected releases are systemd versions up to and including 239.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-15686"
        ]
      },
      {
        "id": "CVE-2019-3815",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "215-17+deb8u11",
        "severity": "Negligible",
        "description": "A memory leak was discovered in the backport of fixes for CVE-2018-16864 in Red Hat Enterprise Linux. Function dispatch_message_real() in journald-server.c does not free the memory allocated by set_iovec_field_free() to store the `_CMDLINE=` entry. A local attacker may use this flaw to make systemd-journald crash. This issue only affects versions shipped with Red Hat Enterprise since v219-62.2.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-3815"
        ]
      },
      {
        "id": "CVE-2018-6954",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "",
        "severity": "Low",
        "description": "systemd-tmpfiles in systemd through 237 mishandles symlinks present in non-terminal path components, which allows local users to obtain ownership of arbitrary files via vectors involving creation of a directory and a file under that directory, and later replacing that directory with a symlink. This occurs even if the fs.protected_symlinks sysctl is turned on.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-6954"
        ]
      },
      {
        "id": "CVE-2018-1049",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "215-17+deb8u8",
        "severity": "Medium",
        "description": "In systemd prior to 234 a race condition exists between .mount and .automount units such that automount requests from kernel may not be serviced by systemd resulting in kernel holding the mountpoint and any processes that try to use said mount will hang. A race condition like this may lead to denial of service, until mount points are unmounted.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-1049"
        ]
      },
      {
        "id": "CVE-2019-20386",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "",
        "severity": "Low",
        "description": "An issue was discovered in button_open in login/logind-button.c in systemd before 243. When executing the udevadm trigger command, a memory leak may occur.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-20386"
        ]
      },
      {
        "id": "CVE-2018-20839",
        "package": "systemd",
        "version": "215-17+deb8u6",
        "fix_version": "",
        "severity": "Low",
        "description": "systemd 242 changes the VT1 mode upon a logout, which allows attackers to read cleartext passwords in certain circumstances, such as watching a shutdown, or using Ctrl-Alt-F1 and Ctrl-Alt-F2. This occurs because the KDGKBMODE (aka current keyboard mode) check is mishandled.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20839"
        ]
      },
      {
        "id": "CVE-2016-9063",
        "package": "expat",
        "version": "2.1.0-6+deb8u3",
        "fix_version": "2.1.0-6+deb8u4",
        "severity": "Negligible",
        "description": "An integer overflow during the parsing of XML using the Expat library. This vulnerability affects Firefox \u003c 50.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-9063"
        ]
      },
      {
        "id": "CVE-2019-15903",
        "package": "expat",
        "version": "2.1.0-6+deb8u3",
        "fix_version": "2.1.0-6+deb8u6",
        "severity": "Negligible",
        "description": "In libexpat before 2.2.8, crafted XML input could fool the parser into changing from DTD parsing to document parsing too early; a consecutive call to XML_GetCurrentLineNumber (or XML_GetCurrentColumnNumber) then resulted in a heap-based buffer over-read.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-15903"
        ]
      },
      {
        "id": "CVE-2017-9233",
        "package": "expat",
        "version": "2.1.0-6+deb8u3",
        "fix_version": "2.1.0-6+deb8u4",
        "severity": "Medium",
        "description": "XML External Entity vulnerability in libexpat 2.2.0 and earlier (Expat XML Parser Library) allows attackers to put the parser in an infinite loop using a malformed external entity definition from an external DTD.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9233"
        ]
      },
      {
        "id": "CVE-2013-0340",
        "package": "expat",
        "version": "2.1.0-6+deb8u3",
        "fix_version": "",
        "severity": "Negligible",
        "description": "expat 2.1.0 and earlier does not properly handle entities expansion unless an application developer uses the XML_SetEntityDeclHandler function, which allows remote attackers to cause a denial of service (resource consumption), send HTTP requests to intranet servers, or read arbitrary files via a crafted XML document, aka an XML External Entity (XXE) issue.  NOTE: it could be argued that because expat already provides the ability to disable external entity expansion, the responsibility for resolving this issue lies with application developers; according to this argument, this entry should be REJECTed, and each affected application would need its own CVE.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2013-0340"
        ]
      },
      {
        "id": "CVE-2018-20843",
        "package": "expat",
        "version": "2.1.0-6+deb8u3",
        "fix_version": "2.1.0-6+deb8u5",
        "severity": "High",
        "description": "In libexpat in Expat before 2.2.7, XML input including XML names that contain a large number of colons could make the XML parser consume a high amount of RAM and CPU resources while processing (enough to be usable for denial-of-service attacks).",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-20843"
        ]
      },
      {
        "id": "CVE-2019-5068",
        "package": "mesa",
        "version": "10.3.2-1+deb8u1",
        "fix_version": "10.3.2-1+deb8u2",
        "severity": "Low",
        "description": "An exploitable shared memory permissions vulnerability exists in the functionality of X11 Mesa 3D Graphics Library 19.1.2. An attacker can access the shared memory without any specific permissions to trigger this vulnerability.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-5068"
        ]
      },
      {
        "id": "CVE-2017-15131",
        "package": "xdg-user-dirs",
        "version": "0.15-2",
        "fix_version": "",
        "severity": "Negligible",
        "description": "It was found that system umask policy is not being honored when creating XDG user directories, since Xsession sources xdg-user-dirs.sh before setting umask policy. This only affects xdg-user-dirs before 0.15.5 as shipped with Red Hat Enterprise Linux.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-15131"
        ]
      },
      {
        "id": "CVE-2016-3977",
        "package": "giflib",
        "version": "4.1.6-11+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "Heap-based buffer overflow in util/gif2rgb.c in gif2rgb in giflib 5.1.2 allows remote attackers to cause a denial of service (application crash) via the background color index in a GIF file.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-3977"
        ]
      },
      {
        "id": "CVE-2018-11489",
        "package": "giflib",
        "version": "4.1.6-11+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "The DGifDecompressLine function in dgif_lib.c in GIFLIB (possibly version 3.0.x), as later shipped in cgif.c in sam2p 0.49.4, has a heap-based buffer overflow because a certain CrntCode array index is not checked. This will lead to a denial of service or possibly unspecified other impact.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-11489"
        ]
      },
      {
        "id": "CVE-2019-15133",
        "package": "giflib",
        "version": "4.1.6-11+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "In GIFLIB before 2019-02-16, a malformed GIF file triggers a divide-by-zero exception in the decoder function DGifSlurp in dgif_lib.c if the height field of the ImageSize data structure is equal to zero.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-15133"
        ]
      },
      {
        "id": "CVE-2018-11490",
        "package": "giflib",
        "version": "4.1.6-11+deb8u1",
        "fix_version": "",
        "severity": "Medium",
        "description": "The DGifDecompressLine function in dgif_lib.c in GIFLIB (possibly version 3.0.x), as later shipped in cgif.c in sam2p 0.49.4, has a heap-based buffer overflow because a certain \"Private-\u003eRunningCode - 2\" array index is not checked. This will lead to a denial of service or possibly unspecified other impact.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-11490"
        ]
      },
      {
        "id": "CVE-2015-5224",
        "package": "util-linux",
        "version": "2.25.2-6",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The mkostemp function in login-utils in util-linux when used incorrectly allows remote attackers to cause file name collision and possibly other attacks.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-5224"
        ]
      },
      {
        "id": "CVE-2017-2616",
        "package": "util-linux",
        "version": "2.25.2-6",
        "fix_version": "",
        "severity": "Negligible",
        "description": "A race condition was found in util-linux before 2.32.1 in the way su handled the management of child processes. A local authenticated attacker could use this flaw to kill other processes with root privileges under specific conditions.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-2616"
        ]
      },
      {
        "id": "CVE-2016-5011",
        "package": "util-linux",
        "version": "2.25.2-6",
        "fix_version": "",
        "severity": "Medium",
        "description": "The parse_dos_extended function in partitions/dos.c in the libblkid library in util-linux allows physically proximate attackers to cause a denial of service (memory consumption) via a crafted MSDOS partition table with an extended partition boot record at zero offset.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-5011"
        ]
      },
      {
        "id": "CVE-2015-5218",
        "package": "util-linux",
        "version": "2.25.2-6",
        "fix_version": "",
        "severity": "Negligible",
        "description": "Buffer overflow in text-utils/colcrt.c in colcrt in util-linux before 2.27 allows local users to cause a denial of service (crash) via a crafted file, related to the page global variable.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2015-5218"
        ]
      },
      {
        "id": "CVE-2016-2779",
        "package": "util-linux",
        "version": "2.25.2-6",
        "fix_version": "",
        "severity": "High",
        "description": "runuser in util-linux allows local users to escape to the parent session via a crafted TIOCSTI ioctl call, which pushes characters to the terminal's input buffer.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-2779"
        ]
      },
      {
        "id": "CVE-2017-10140",
        "package": "db5.3",
        "version": "5.3.28-9",
        "fix_version": "5.3.28-9+deb8u1",
        "severity": "Medium",
        "description": "Postfix before 2.11.10, 3.0.x before 3.0.10, 3.1.x before 3.1.6, and 3.2.x before 3.2.2 might allow local users to gain privileges by leveraging undocumented functionality in Berkeley DB 2.x and later, related to reading settings from DB_CONFIG in the current directory.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-10140"
        ]
      },
      {
        "id": "CVE-2018-16429",
        "package": "glib2.0",
        "version": "2.42.1-1",
        "fix_version": "2.42.1-1+deb8u2",
        "severity": "Low",
        "description": "GNOME GLib 2.56.1 has an out-of-bounds read vulnerability in g_markup_parse_context_parse() in gmarkup.c, related to utf8_str().",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16429"
        ]
      },
      {
        "id": "CVE-2019-13012",
        "package": "glib2.0",
        "version": "2.42.1-1",
        "fix_version": "2.42.1-1+deb8u3",
        "severity": "Medium",
        "description": "The keyfile settings backend in GNOME GLib (aka glib2.0) before 2.60.0 creates directories using g_file_make_directory_with_parents (kfsb-\u003edir, NULL, NULL) and files using g_file_replace_contents (kfsb-\u003efile, contents, length, NULL, FALSE, G_FILE_CREATE_REPLACE_DESTINATION, NULL, NULL, NULL). Consequently, it does not properly restrict directory (and file) permissions. Instead, for directories, 0777 permissions are used; for files, default file permissions are used. This is similar to CVE-2019-12450.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-13012"
        ]
      },
      {
        "id": "CVE-2019-12450",
        "package": "glib2.0",
        "version": "2.42.1-1",
        "fix_version": "2.42.1-1+deb8u1",
        "severity": "High",
        "description": "file_copy_fallback in gio/gfile.c in GNOME GLib 2.15.0 through 2.61.1 does not properly restrict file permissions while a copy operation is in progress. Instead, default permissions are used.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-12450"
        ]
      },
      {
        "id": "CVE-2012-0039",
        "package": "glib2.0",
        "version": "2.42.1-1",
        "fix_version": "",
        "severity": "Negligible",
        "description": "** DISPUTED ** GLib 2.31.8 and earlier, when the g_str_hash function is used, computes hash values without restricting the ability to trigger hash collisions predictably, which allows context-dependent attackers to cause a denial of service (CPU consumption) via crafted input to an application that maintains a hash table.  NOTE: this issue may be disputed by the vendor; the existence of the g_str_hash function is not a vulnerability in the library, because callers of g_hash_table_new and g_hash_table_new_full can specify an arbitrary hash function that is appropriate for the application.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2012-0039"
        ]
      },
      {
        "id": "CVE-2018-16428",
        "package": "glib2.0",
        "version": "2.42.1-1",
        "fix_version": "2.42.1-1+deb8u2",
        "severity": "Low",
        "description": "In GNOME GLib 2.56.1, g_markup_parse_context_end_parse() in gmarkup.c has a NULL pointer dereference.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-16428"
        ]
      },
      {
        "id": "CVE-2016-4484",
        "package": "cryptsetup",
        "version": "2:1.6.6-5",
        "fix_version": "",
        "severity": "Negligible",
        "description": "The Debian initrd script for the cryptsetup package 2:1.7.3-2 and earlier allows physically proximate attackers to gain shell access via many log in attempts with an invalid password.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-4484"
        ]
      },
      {
        "id": "CVE-2020-8991",
        "package": "lvm2",
        "version": "2.02.111-2.2+deb8u1",
        "fix_version": "",
        "severity": "Low",
        "description": "** DISPUTED ** vg_lookup in daemons/lvmetad/lvmetad-core.c in LVM2 2.02 mismanages memory, leading to an lvmetad memory leak, as demonstrated by running pvs. NOTE: RedHat disputes CVE-2020-8991 as not being a vulnerability since there’s no apparent route to either privilege escalation or to denial of service through the bug.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2020-8991"
        ]
      },
      {
        "id": "CVE-2017-9800",
        "package": "subversion",
        "version": "1.8.10-6+deb8u4",
        "fix_version": "1.8.10-6+deb8u5",
        "severity": "High",
        "description": "A maliciously constructed svn+ssh:// URL would cause Subversion clients before 1.8.19, 1.9.x before 1.9.7, and 1.10.0.x through 1.10.0-alpha3 to run an arbitrary shell command. Such a URL could be generated by a malicious server, by a malicious user committing to a honest server (to attack another user of that server's repositories), or by a proxy server. The vulnerability affects all clients, including those that use file://, http://, and plain (untunneled) svn://.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-9800"
        ]
      },
      {
        "id": "CVE-2019-0203",
        "package": "subversion",
        "version": "1.8.10-6+deb8u4",
        "fix_version": "1.8.10-6+deb8u7",
        "severity": "Medium",
        "description": "In Apache Subversion versions up to and including 1.9.10, 1.10.4, 1.12.0, Subversion's svnserve server process may exit when a client sends certain sequences of protocol commands. This can lead to disruption for users of the server.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2019-0203"
        ]
      },
      {
        "id": "CVE-2016-8734",
        "package": "subversion",
        "version": "1.8.10-6+deb8u4",
        "fix_version": "1.8.10-6+deb8u5",
        "severity": "Low",
        "description": "Apache Subversion's mod_dontdothat module and HTTP clients 1.4.0 through 1.8.16, and 1.9.0 through 1.9.4 are vulnerable to a denial-of-service attack caused by exponential XML entity expansion. The attack can cause the targeted process to consume an excessive amount of CPU resources or memory.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2016-8734"
        ]
      },
      {
        "id": "CVE-2018-11782",
        "package": "subversion",
        "version": "1.8.10-6+deb8u4",
        "fix_version": "1.8.10-6+deb8u7",
        "severity": "Medium",
        "description": "In Apache Subversion versions up to and including 1.9.10, 1.10.4, 1.12.0, Subversion's svnserve server process may exit when a well-formed read-only request produces a particular answer. This can lead to disruption for users of the server.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2018-11782"
        ]
      },
      {
        "id": "CVE-2017-6519",
        "package": "avahi",
        "version": "0.6.31-5",
        "fix_version": "",
        "severity": "Negligible",
        "description": "avahi-daemon in Avahi through 0.6.32 and 0.7 inadvertently responds to IPv6 unicast queries with source addresses that are not on-link, which allows remote attackers to cause a denial of service (traffic amplification) and may cause information leakage by obtaining potentially sensitive  information from the responding device via port-5353 UDP packets.  NOTE: this may overlap CVE-2015-2809.",
        "links": [
          "https://security-tracker.debian.org/tracker/CVE-2017-6519"
        ]
      }
    ]
  }
};